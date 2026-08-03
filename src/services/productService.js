import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { Product } from "../models/Product";

const collectionName = "products";

export const productService = {
  // Para la tienda pública: Productos activos Y cuya fecha de lanzamiento ya haya llegado
  getProducts: async () => {
    try {
      const q = query(collection(db, collectionName), where("isActive", "==", true));
      const querySnapshot = await getDocs(q);
      const now = new Date();
      
      return querySnapshot.docs
        .map(Product.fromFirestore)
        .filter(product => {
          if (!product.releaseDate) return true;
          return new Date(product.releaseDate) <= now;
        });
    } catch (error) {
      console.error("Error obteniendo productos públicos:", error);
      throw error;
    }
  },

  // Para el panel Admin: Obtiene TODOS los productos sin filtro
  getAllAdminProducts: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(Product.fromFirestore);
    } catch (error) {
      console.error("Error obteniendo todos los productos:", error);
      throw error;
    }
  },

  // Agregar producto nuevo
  addProduct: async (productData) => {
    try {
      const product = new Product(productData);
      const docRef = await addDoc(collection(db, collectionName), product.toFirestore());
      return docRef.id;
    } catch (error) {
      console.error("Error agregando producto:", error);
      throw error;
    }
  },

  // Editar producto
  updateProduct: async (productId, updates) => {
    try {
      const productRef = doc(db, collectionName, productId);
      await updateDoc(productRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error actualizando producto:", error);
      throw error;
    }
  },

  // NUEVO: Eliminar un producto
  deleteProduct: async (productId) => {
    try {
      const productRef = doc(db, collectionName, productId);
      await deleteDoc(productRef);
    } catch (error) {
      console.error("Error eliminando producto:", error);
      throw error;
    }
  }
};