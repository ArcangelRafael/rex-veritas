import { collection, getDocs, doc, addDoc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { Product } from "../models/Product";

const collectionName = "products";

export const productService = {
  // Obtener todos los productos activos para la tienda
  getProducts: async () => {
    try {
      const q = query(collection(db, collectionName), where("isActive", "==", true));
      const querySnapshot = await getDocs(q);
      // Transformamos los documentos de Firebase en instancias de nuestra clase Product
      return querySnapshot.docs.map(Product.fromFirestore);
    } catch (error) {
      console.error("Error obteniendo productos:", error);
      throw error;
    }
  },

  // Para el panel de Admin: Agregar un producto nuevo
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

  // Para el panel de Admin: Editar un producto (ej. pausar su venta o cambiar precio)
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
  }
};