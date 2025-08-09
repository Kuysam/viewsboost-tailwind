#!/usr/bin/env node

/**
 * Firebase Data Extractor for Template URL Mapping Analysis
 * 
 * This script extracts all necessary data from Firebase Firestore and Storage
 * to help identify and fix template URL mappings.
 * 
 * Usage: node extract-firebase-data.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
try {
  const serviceAccount = require('./serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'viewsboostv2.firebasestorage.app'
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

class FirebaseDataExtractor {
  
  constructor() {
    this.firestoreData = [];
    this.storageFiles = {
      video: [],
      images: []
    };
    this.mappingAnalysis = [];
    this.missingFiles = [];
    this.suggestedMappings = {};
  }

  /**
   * Extract all Firestore templates with their exact field values
   */
  async extractFirestoreTemplates() {
    console.log('\n🔍 Extracting Firestore Templates...');
    
    try {
      const collections = ['templates', 'Templates', 'videoTemplates', 'imageTemplates'];
      let totalFound = 0;
      
      for (const collectionName of collections) {
        try {
          console.log(`   Checking collection: ${collectionName}`);
          const snapshot = await db.collection(collectionName).get();
          
          if (snapshot.empty) {
            console.log(`   - Collection ${collectionName}: Empty`);
            continue;
          }
          
          console.log(`   - Collection ${collectionName}: ${snapshot.size} documents`);
          
          snapshot.forEach(doc => {
            const data = doc.data();
            this.firestoreData.push({
              id: doc.id,
              collection: collectionName,
              ...data,
              _extractedAt: new Date().toISOString()
            });
            totalFound++;
          });
          
        } catch (error) {
          console.log(`   - Collection ${collectionName}: Access denied or doesn't exist`);
        }
      }
      
      console.log(`✅ Found ${totalFound} total Firestore templates`);
      
    } catch (error) {
      console.error('❌ Error extracting Firestore templates:', error.message);
    }
  }

  /**
   * List all Firebase Storage files in Templates folder structure
   */
  async extractStorageFiles() {
    console.log('\n🔍 Extracting Firebase Storage Files...');
    
    try {
      // Extract Templates/Video/ files
      console.log('   Checking Templates/Video/ folder...');
      const [videoFiles] = await bucket.getFiles({
        prefix: 'Templates/Video/',
        delimiter: '/'
      });
      
      for (const file of videoFiles) {
        const metadata = await file.getMetadata();
        this.storageFiles.video.push({
          name: file.name,
          fullPath: file.name,
          fileName: path.basename(file.name),
          size: metadata[0].size,
          contentType: metadata[0].contentType,
          timeCreated: metadata[0].timeCreated,
          updated: metadata[0].updated,
          publicUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`
        });
      }
      
      console.log(`   - Found ${this.storageFiles.video.length} video files`);
      
      // Extract Templates/Images/ files
      console.log('   Checking Templates/Images/ folder...');
      const [imageFiles] = await bucket.getFiles({
        prefix: 'Templates/Images/',
        delimiter: '/'
      });
      
      for (const file of imageFiles) {
        const metadata = await file.getMetadata();
        this.storageFiles.images.push({
          name: file.name,
          fullPath: file.name,
          fileName: path.basename(file.name),
          size: metadata[0].size,
          contentType: metadata[0].contentType,
          timeCreated: metadata[0].timeCreated,
          updated: metadata[0].updated,
          publicUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`
        });
      }
      
      console.log(`   - Found ${this.storageFiles.images.length} image files`);
      
      // Also check root Templates/ folder for any other files
      console.log('   Checking Templates/ root folder...');
      const [rootFiles] = await bucket.getFiles({
        prefix: 'Templates/',
        delimiter: '/'
      });
      
      const otherFiles = rootFiles.filter(file => 
        !file.name.startsWith('Templates/Video/') && 
        !file.name.startsWith('Templates/Images/') &&
        file.name !== 'Templates/'
      );
      
      if (otherFiles.length > 0) {
        console.log(`   - Found ${otherFiles.length} other files in Templates/ root`);
        this.storageFiles.other = [];
        
        for (const file of otherFiles) {
          const metadata = await file.getMetadata();
          this.storageFiles.other.push({
            name: file.name,
            fullPath: file.name,
            fileName: path.basename(file.name),
            size: metadata[0].size,
            contentType: metadata[0].contentType,
            timeCreated: metadata[0].timeCreated,
            updated: metadata[0].updated,
            publicUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Error extracting Storage files:', error.message);
    }
  }

  /**
   * Create mapping analysis showing which templates match which storage files
   */
  createMappingAnalysis() {
    console.log('\n🔍 Creating Mapping Analysis...');
    
    const allStorageFiles = [
      ...this.storageFiles.video.map(f => ({ ...f, type: 'video' })),
      ...this.storageFiles.images.map(f => ({ ...f, type: 'image' })),
      ...(this.storageFiles.other || []).map(f => ({ ...f, type: 'other' }))
    ];
    
    for (const template of this.firestoreData) {
      const analysis = {
        template: {
          id: template.id,
          collection: template.collection,
          title: template.title || 'N/A',
          displayName: template.displayName || template.name || 'N/A',
          category: template.category || 'N/A',
          type: template.type || 'unknown',
          videoSource: template.videoSource || 'N/A',
          preview: template.preview || 'N/A',
          imageUrl: template.imageUrl || 'N/A'
        },
        possibleMatches: [],
        exactMatches: [],
        suggestions: []
      };
      
      const title = template.title || template.displayName || template.name || '';
      if (!title) {
        analysis.suggestions.push('⚠️ Template has no title field');
        this.mappingAnalysis.push(analysis);
        continue;
      }
      
      // Generate possible filename variations
      const titleVariations = this.generateTitleVariations(title);
      
      // Find matches in storage files
      for (const storageFile of allStorageFiles) {
        const fileName = storageFile.fileName.toLowerCase();
        const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        
        // Check for exact matches
        if (titleVariations.some(variation => 
          fileNameWithoutExt === variation.toLowerCase() ||
          fileName === variation.toLowerCase()
        )) {
          analysis.exactMatches.push({
            file: storageFile,
            matchType: 'exact',
            confidence: 'high'
          });
        }
        // Check for partial matches
        else if (titleVariations.some(variation => 
          fileNameWithoutExt.includes(variation.toLowerCase()) ||
          variation.toLowerCase().includes(fileNameWithoutExt)
        )) {
          analysis.possibleMatches.push({
            file: storageFile,
            matchType: 'partial',
            confidence: 'medium'
          });
        }
      }
      
      // Generate suggestions
      if (analysis.exactMatches.length === 0 && analysis.possibleMatches.length === 0) {
        this.missingFiles.push({
          template: analysis.template,
          expectedFilenames: titleVariations
        });
        analysis.suggestions.push('❌ No matching files found in storage');
        analysis.suggestions.push(`💡 Expected filenames: ${titleVariations.join(', ')}`);
      } else if (analysis.exactMatches.length > 0) {
        analysis.suggestions.push('✅ Has exact matches');
        
        // Generate mapping code for exact matches
        const videoMatch = analysis.exactMatches.find(m => m.file.type === 'video');
        const imageMatch = analysis.exactMatches.find(m => m.file.type === 'image');
        
        if (videoMatch || imageMatch) {
          const mappingKey = title.toLowerCase().replace(/\s+/g, '');
          this.suggestedMappings[mappingKey] = {};
          
          if (videoMatch) {
            this.suggestedMappings[mappingKey].video = videoMatch.file.fullPath.replace('Templates/', 'Templates%2F').replace('/', '%2F');
          }
          if (imageMatch) {
            this.suggestedMappings[mappingKey].image = imageMatch.file.fullPath.replace('Templates/', 'Templates%2F').replace('/', '%2F');
          }
        }
      } else {
        analysis.suggestions.push('⚠️ Only partial matches found - review manually');
      }
      
      this.mappingAnalysis.push(analysis);
    }
    
    console.log(`✅ Analyzed ${this.mappingAnalysis.length} templates`);
  }

  /**
   * Generate multiple filename variations for a template title
   */
  generateTitleVariations(title) {
    const variations = new Set();
    
    // Original title
    variations.add(title);
    
    // Lowercase
    variations.add(title.toLowerCase());
    
    // Remove spaces
    variations.add(title.replace(/\s+/g, ''));
    variations.add(title.toLowerCase().replace(/\s+/g, ''));
    
    // Replace spaces with dashes
    variations.add(title.replace(/\s+/g, '-'));
    variations.add(title.toLowerCase().replace(/\s+/g, '-'));
    
    // Replace spaces with underscores
    variations.add(title.replace(/\s+/g, '_'));
    variations.add(title.toLowerCase().replace(/\s+/g, '_'));
    
    // Remove all non-alphanumeric characters
    variations.add(title.replace(/[^a-zA-Z0-9]/g, ''));
    variations.add(title.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''));
    
    // Common abbreviations/shortenings
    if (title.length > 10) {
      variations.add(title.substring(0, 10));
      variations.add(title.toLowerCase().substring(0, 10));
    }
    
    return Array.from(variations);
  }

  /**
   * Format and export all data
   */
  async exportData() {
    console.log('\n📊 Formatting and Exporting Data...');
    
    const report = {
      metadata: {
        extractedAt: new Date().toISOString(),
        totalTemplates: this.firestoreData.length,
        totalVideoFiles: this.storageFiles.video.length,
        totalImageFiles: this.storageFiles.images.length,
        totalOtherFiles: (this.storageFiles.other || []).length,
        missingMappings: this.missingFiles.length
      },
      
      firestoreTemplates: this.firestoreData,
      
      storageFiles: this.storageFiles,
      
      mappingAnalysis: this.mappingAnalysis,
      
      missingFiles: this.missingFiles,
      
      suggestedMappings: this.suggestedMappings
    };
    
    // Write detailed JSON report
    const jsonPath = path.join(__dirname, 'firebase-data-extraction-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`✅ Detailed JSON report: ${jsonPath}`);
    
    // Write human-readable summary
    const summaryPath = path.join(__dirname, 'firebase-mapping-summary.md');
    const summary = this.generateHumanReadableSummary(report);
    fs.writeFileSync(summaryPath, summary);
    console.log(`✅ Human-readable summary: ${summaryPath}`);
    
    // Write TypeScript mappings file
    const mappingsPath = path.join(__dirname, 'suggested-firebase-mappings.ts');
    const mappingsCode = this.generateMappingsCode();
    fs.writeFileSync(mappingsPath, mappingsCode);
    console.log(`✅ TypeScript mappings: ${mappingsPath}`);
    
    return report;
  }

  /**
   * Generate human-readable summary
   */
  generateHumanReadableSummary(report) {
    let summary = `# Firebase Template URL Mapping Analysis\n\n`;
    summary += `**Generated:** ${report.metadata.extractedAt}\n\n`;
    
    // Overview
    summary += `## 📊 Overview\n\n`;
    summary += `- **Total Firestore Templates:** ${report.metadata.totalTemplates}\n`;
    summary += `- **Total Video Files:** ${report.metadata.totalVideoFiles}\n`;
    summary += `- **Total Image Files:** ${report.metadata.totalImageFiles}\n`;
    summary += `- **Missing Mappings:** ${report.metadata.missingMappings}\n\n`;
    
    // Firestore Templates
    summary += `## 🗃️ All Firestore Templates\n\n`;
    for (const template of report.firestoreTemplates) {
      summary += `### ${template.title || template.displayName || template.name || 'Untitled'}\n`;
      summary += `- **ID:** ${template.id}\n`;
      summary += `- **Collection:** ${template.collection}\n`;
      summary += `- **Title:** ${template.title || 'N/A'}\n`;
      summary += `- **Display Name:** ${template.displayName || template.name || 'N/A'}\n`;
      summary += `- **Category:** ${template.category || 'N/A'}\n`;
      summary += `- **Type:** ${template.type || 'unknown'}\n`;
      summary += `- **Video Source:** ${template.videoSource || 'N/A'}\n`;
      summary += `- **Preview:** ${template.preview || 'N/A'}\n`;
      summary += `- **Image URL:** ${template.imageUrl || 'N/A'}\n\n`;
    }
    
    // Storage Files
    summary += `## 📁 Firebase Storage Files\n\n`;
    summary += `### Video Files (Templates/Video/)\n\n`;
    for (const file of report.storageFiles.video) {
      summary += `- **${file.fileName}**\n`;
      summary += `  - Path: ${file.fullPath}\n`;
      summary += `  - Size: ${this.formatBytes(file.size)}\n`;
      summary += `  - Created: ${file.timeCreated}\n`;
      summary += `  - URL: ${file.publicUrl}\n\n`;
    }
    
    summary += `### Image Files (Templates/Images/)\n\n`;
    for (const file of report.storageFiles.images) {
      summary += `- **${file.fileName}**\n`;
      summary += `  - Path: ${file.fullPath}\n`;
      summary += `  - Size: ${this.formatBytes(file.size)}\n`;
      summary += `  - Created: ${file.timeCreated}\n`;
      summary += `  - URL: ${file.publicUrl}\n\n`;
    }
    
    // Mapping Analysis
    summary += `## 🔍 Mapping Analysis\n\n`;
    for (const analysis of report.mappingAnalysis) {
      summary += `### Template: ${analysis.template.title}\n`;
      summary += `- **Collection:** ${analysis.template.collection}\n`;
      summary += `- **Current Video Source:** ${analysis.template.videoSource}\n`;
      summary += `- **Current Preview:** ${analysis.template.preview}\n`;
      
      if (analysis.exactMatches.length > 0) {
        summary += `- **✅ Exact Matches:**\n`;
        for (const match of analysis.exactMatches) {
          summary += `  - ${match.file.fileName} (${match.file.type})\n`;
        }
      }
      
      if (analysis.possibleMatches.length > 0) {
        summary += `- **⚠️ Possible Matches:**\n`;
        for (const match of analysis.possibleMatches) {
          summary += `  - ${match.file.fileName} (${match.file.type})\n`;
        }
      }
      
      if (analysis.suggestions.length > 0) {
        summary += `- **💡 Suggestions:**\n`;
        for (const suggestion of analysis.suggestions) {
          summary += `  - ${suggestion}\n`;
        }
      }
      
      summary += `\n`;
    }
    
    // Missing Files
    summary += `## ❌ Missing Files Report\n\n`;
    if (report.missingFiles.length === 0) {
      summary += `✅ All templates have matching files!\n\n`;
    } else {
      for (const missing of report.missingFiles) {
        summary += `### ${missing.template.title}\n`;
        summary += `- **Expected filenames:** ${missing.expectedFilenames.join(', ')}\n`;
        summary += `- **Template ID:** ${missing.template.id}\n`;
        summary += `- **Collection:** ${missing.template.collection}\n\n`;
      }
    }
    
    // Suggested Mappings
    summary += `## 🛠️ Suggested Mappings Code\n\n`;
    summary += `Copy this into your \`firebaseStorageMapper.ts\` file:\n\n`;
    summary += `\`\`\`typescript\n`;
    summary += `static getKnownFileMappings(): Record<string, { video?: string, image?: string }> {\n`;
    summary += `  return {\n`;
    
    for (const [key, mapping] of Object.entries(report.suggestedMappings)) {
      summary += `    '${key}': { \n`;
      if (mapping.video) {
        summary += `      video: '${mapping.video}',\n`;
      }
      if (mapping.image) {
        summary += `      image: '${mapping.image}'\n`;
      }
      summary += `    },\n`;
    }
    
    summary += `  };\n`;
    summary += `}\n`;
    summary += `\`\`\`\n\n`;
    
    return summary;
  }

  /**
   * Generate TypeScript mappings code
   */
  generateMappingsCode() {
    let code = `// Auto-generated Firebase Storage mappings\n`;
    code += `// Generated at: ${new Date().toISOString()}\n\n`;
    
    code += `export const FIREBASE_STORAGE_MAPPINGS = {\n`;
    
    for (const [key, mapping] of Object.entries(this.suggestedMappings)) {
      code += `  '${key}': {\n`;
      if (mapping.video) {
        code += `    video: '${mapping.video}',\n`;
      }
      if (mapping.image) {
        code += `    image: '${mapping.image}'\n`;
      }
      code += `  },\n`;
    }
    
    code += `};\n\n`;
    
    code += `// Usage in firebaseStorageMapper.ts:\n`;
    code += `// Replace the existing getKnownFileMappings() method with:\n`;
    code += `/*\n`;
    code += `static getKnownFileMappings(): Record<string, { video?: string, image?: string }> {\n`;
    code += `  return FIREBASE_STORAGE_MAPPINGS;\n`;
    code += `}\n`;
    code += `*/\n`;
    
    return code;
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Run the complete extraction process
   */
  async run() {
    console.log('🚀 Starting Firebase Data Extraction...\n');
    
    try {
      await this.extractFirestoreTemplates();
      await this.extractStorageFiles();
      this.createMappingAnalysis();
      const report = await this.exportData();
      
      console.log('\n✅ Extraction completed successfully!');
      console.log('\n📋 Summary:');
      console.log(`   - Firestore templates: ${report.metadata.totalTemplates}`);
      console.log(`   - Video files: ${report.metadata.totalVideoFiles}`);
      console.log(`   - Image files: ${report.metadata.totalImageFiles}`);
      console.log(`   - Missing mappings: ${report.metadata.missingMappings}`);
      console.log('\n📄 Generated files:');
      console.log('   - firebase-data-extraction-report.json (detailed data)');
      console.log('   - firebase-mapping-summary.md (human-readable)');
      console.log('   - suggested-firebase-mappings.ts (code to copy)');
      
    } catch (error) {
      console.error('\n❌ Extraction failed:', error);
      throw error;
    }
  }
}

// Run the extraction if this script is executed directly
if (require.main === module) {
  const extractor = new FirebaseDataExtractor();
  
  extractor.run()
    .then(() => {
      console.log('\n🎉 All done! Check the generated files for your mapping data.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = FirebaseDataExtractor;