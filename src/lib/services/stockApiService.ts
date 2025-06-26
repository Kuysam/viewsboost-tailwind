// Basic stock API service for AdminPanel
// This is a placeholder implementation to prevent import errors

class StockApiService {
  async searchImages(query: string): Promise<any[]> {
    // Placeholder implementation
    console.log('🔍 [StockAPI] Search images called - placeholder implementation');
    return [];
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    // Placeholder implementation
    console.log('🧪 [StockAPI] Test connection called - placeholder implementation');
    return {
      success: true,
      message: 'Stock API service not implemented yet'
    };
  }
}

export const stockApiService = new StockApiService();
export default stockApiService; 