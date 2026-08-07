import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Offer } from '../models/Offer';

const collectionName = 'offers';

export const offerService = {
  getOffers: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(Offer.fromFirestore);
    } catch (error) {
      console.error("Error obteniendo ofertas:", error);
      throw error;
    }
  },

  getActiveOffers: async () => {
    try {
      const allOffers = await offerService.getOffers();
      return allOffers.filter(offer => offer.isValid());
    } catch (error) {
      console.error("Error obteniendo ofertas activas:", error);
      throw error;
    }
  },

  addOffer: async (offerData) => {
    try {
      const offer = new Offer(offerData);
      const newRef = doc(collection(db, collectionName));
      await setDoc(newRef, offer.toFirestore());
      return newRef.id;
    } catch (error) {
      console.error("Error agregando oferta:", error);
      throw error;
    }
  },

  updateOffer: async (id, updates) => {
    try {
      const ref = doc(db, collectionName, id);
      await updateDoc(ref, { ...updates, updatedAt: new Date() });
    } catch (error) {
      console.error("Error actualizando oferta:", error);
      throw error;
    }
  },

  deleteOffer: async (id) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error("Error eliminando oferta:", error);
      throw error;
    }
  },

  // NUEVO: Registra +1 en el contador de usos del cupón
  incrementOfferUsage: async (id) => {
    try {
      const ref = doc(db, collectionName, id);
      await updateDoc(ref, { currentUses: increment(1) });
    } catch (error) {
      console.error("Error sumando uso al cupón:", error);
      throw error;
    }
  }
};