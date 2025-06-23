import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  increment,
} from 'firebase/firestore';

export interface LocalStream {
  id: string;
  userId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  isLive: boolean;
  startedAt: Date;
  endedAt?: Date;
  viewers: number;
  likes: number;
  comments: number;
  tags: string[];
  category: string;
  streamKey: string;
  rtmpUrl: string;
}

export interface LiveRoom {
  id: string;
  hostId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  participants: number;
  maxParticipants: number;
  tags: string[];
  category: string;
  isPrivate: boolean;
  password?: string;
  allowedUsers?: string[];
}

// Local Stream Functions
export const startLocalStream = async (
  userId: string,
  streamData: Omit<LocalStream, 'id' | 'userId' | 'startedAt' | 'viewers' | 'likes' | 'comments'>
): Promise<LocalStream> => {
  const streamRef = doc(collection(db, 'localStreams'));
  const stream: LocalStream = {
    id: streamRef.id,
    userId,
    ...streamData,
    startedAt: new Date(),
    viewers: 0,
    likes: 0,
    comments: 0,
  };

  await setDoc(streamRef, stream);
  return stream;
};

export const endLocalStream = async (streamId: string): Promise<void> => {
  const streamRef = doc(db, 'localStreams', streamId);
  await updateDoc(streamRef, {
    isLive: false,
    endedAt: new Date(),
  });
};

export const updateStreamViewers = async (streamId: string, increment: number): Promise<void> => {
  const streamRef = doc(db, 'localStreams', streamId);
  await updateDoc(streamRef, {
    viewers: increment,
  });
};

export const likeStream = async (streamId: string): Promise<void> => {
  const streamRef = doc(db, 'localStreams', streamId);
  await updateDoc(streamRef, {
    likes: increment(1),
  });
};

// Live Room Functions
export const createLiveRoom = async (
  hostId: string,
  roomData: Omit<LiveRoom, 'id' | 'hostId' | 'startedAt' | 'participants' | 'isActive'>
): Promise<LiveRoom> => {
  const roomRef = doc(collection(db, 'liveRooms'));
  const room: LiveRoom = {
    id: roomRef.id,
    hostId,
    ...roomData,
    startedAt: new Date(),
    participants: 1,
    isActive: true,
  };

  await setDoc(roomRef, room);
  return room;
};

export const endLiveRoom = async (roomId: string): Promise<void> => {
  const roomRef = doc(db, 'liveRooms', roomId);
  await updateDoc(roomRef, {
    isActive: false,
    endedAt: new Date(),
  });
};

export const joinLiveRoom = async (roomId: string, userId: string): Promise<void> => {
  const roomRef = doc(db, 'liveRooms', roomId);
  const roomDoc = await getDoc(roomRef);
  const room = roomDoc.data() as LiveRoom;

  if (!room.isActive) {
    throw new Error('Room is not active');
  }

  if (room.participants >= room.maxParticipants) {
    throw new Error('Room is full');
  }

  if (room.isPrivate && !room.allowedUsers?.includes(userId)) {
    throw new Error('You are not allowed to join this room');
  }

  await updateDoc(roomRef, {
    participants: increment(1),
  });
};

export const leaveLiveRoom = async (roomId: string): Promise<void> => {
  const roomRef = doc(db, 'liveRooms', roomId);
  await updateDoc(roomRef, {
    participants: increment(-1),
  });
};

// Query Functions
export const getActiveLocalStreams = async (): Promise<LocalStream[]> => {
  const streamsRef = collection(db, 'localStreams');
  const q = query(
    streamsRef,
    where('isLive', '==', true),
    orderBy('startedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as LocalStream);
};

export const getActiveLiveRooms = async (): Promise<LiveRoom[]> => {
  const roomsRef = collection(db, 'liveRooms');
  const q = query(
    roomsRef,
    where('isActive', '==', true),
    orderBy('startedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as LiveRoom);
};

export const getUserStreams = async (userId: string): Promise<LocalStream[]> => {
  const streamsRef = collection(db, 'localStreams');
  const q = query(
    streamsRef,
    where('userId', '==', userId),
    orderBy('startedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as LocalStream);
};

export const getUserRooms = async (userId: string): Promise<LiveRoom[]> => {
  const roomsRef = collection(db, 'liveRooms');
  const q = query(
    roomsRef,
    where('hostId', '==', userId),
    orderBy('startedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as LiveRoom);
}; 