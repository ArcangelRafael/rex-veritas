import { collection, doc, runTransaction, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { Order } from "../models/Order";

const ordersCollection = "orders";
const productsCollection = "products";

export const orderService = {
  // 1. Crear pedido con validación estricta de stock
  createOrder: async (orderData) => {
    try {
      const orderId = await runTransaction(db, async (transaction) => {
        const productRefs = orderData.items.map(item => doc(db, productsCollection, item.productId));
        const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        productDocs.forEach((productDoc, index) => {
          const item = orderData.items[index];
          if (!productDoc.exists()) throw new Error(`El producto ${item.name} ya no existe.`);
          if (productDoc.data().stock < item.quantity) throw new Error(`Stock insuficiente para: ${item.name}`);
        });

        productDocs.forEach((productDoc, index) => {
          const item = orderData.items[index];
          const newStock = productDoc.data().stock - item.quantity;
          transaction.update(productRefs[index], { stock: newStock });
        });

        const order = new Order(orderData);
        const newOrderRef = doc(collection(db, ordersCollection));
        transaction.set(newOrderRef, order.toFirestore());

        return newOrderRef.id;
      });

      return orderId;
    } catch (error) {
      console.error("Error al procesar la compra:", error);
      throw error;
    }
  },

  // 2. Obtener todos los pedidos y ordenarlos del más nuevo al más viejo
  getOrders: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, ordersCollection));
      const orders = querySnapshot.docs.map(Order.fromFirestore);
      // Ordenamos por fecha descendente usando JavaScript
      return orders.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error obteniendo pedidos:", error);
      throw error;
    }
  },

  // 3. Marcar pedido como pagado/entregado
  completeOrder: async (orderId) => {
    try {
      const orderRef = doc(db, ordersCollection, orderId);
      await updateDoc(orderRef, { status: 'COMPLETED' });
    } catch (error) {
      console.error("Error al completar el pedido:", error);
      throw error;
    }
  },

  // 4. Cancelar pedido y DEVOLVER stock de forma segura (Nivel Senior)
  cancelOrderAndReturnStock: async (orderId, items) => {
    try {
      await runTransaction(db, async (transaction) => {
        // A. Leer el stock actual de los productos
        const productRefs = items.map(item => doc(db, productsCollection, item.productId));
        const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        // B. Sumar el stock que el cliente había apartado
        productDocs.forEach((productDoc, index) => {
          if (productDoc.exists()) {
            const currentStock = productDoc.data().stock;
            const quantityToReturn = items[index].quantity;
            transaction.update(productRefs[index], { stock: currentStock + quantityToReturn });
          }
        });

        // C. Marcar el pedido como cancelado
        const orderRef = doc(db, ordersCollection, orderId);
        transaction.update(orderRef, { status: 'CANCELLED' });
      });
    } catch (error) {
      console.error("Error al cancelar y devolver stock:", error);
      throw error;
    }
  }
};