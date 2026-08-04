import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "../config/firebase";
import { Message } from "../models/Message";

const collectionName = "messages";

export const messageService = {
  getMessages: async () => {
    try {
      const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(Message.fromFirestore);
    } catch (error) {
      console.error("Error obteniendo mensajes:", error);
      throw error;
    }
  },

  addMessage: async (messageData) => {
    try {
      const msg = new Message(messageData);
      const docRef = await addDoc(collection(db, collectionName), msg.toFirestore());
      return docRef.id;
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      throw error;
    }
  },

  markAsRead: async (messageId) => {
    try {
      await updateDoc(doc(db, collectionName, messageId), { isRead: true });
    } catch (error) {
      console.error("Error actualizando mensaje:", error);
      throw error;
    }
  },

  // NUEVO: Archivar mensaje
  archiveMessage: async (messageId) => {
    try {
      await updateDoc(doc(db, collectionName, messageId), { isArchived: true });
    } catch (error) {
      console.error("Error archivando mensaje:", error);
      throw error;
    }
  },

  // NUEVO: Desarchivar mensaje (por si te equivocas)
  unarchiveMessage: async (messageId) => {
    try {
      await updateDoc(doc(db, collectionName, messageId), { isArchived: false });
    } catch (error) {
      console.error("Error desarchivando mensaje:", error);
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await deleteDoc(doc(db, collectionName, messageId));
    } catch (error) {
      console.error("Error eliminando mensaje:", error);
      throw error;
    }
  }
};