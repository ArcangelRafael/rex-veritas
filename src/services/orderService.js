import { collection, doc, runTransaction, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { Order } from "../models/Order";

const ordersCollection = "orders";
const productsCollection = "products";

export const orderService = {
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

  getOrders: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, ordersCollection));
      const orders = querySnapshot.docs.map(Order.fromFirestore);
      return orders.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error obteniendo pedidos:", error);
      throw error;
    }
  },

  completeOrder: async (orderId) => {
    try {
      const orderRef = doc(db, ordersCollection, orderId);
      // Solo las órdenes que se completan cambian de estado y se van a tu pestaña "Concluidas"
      await updateDoc(orderRef, { status: 'COMPLETED' });
    } catch (error) {
      console.error("Error al completar el pedido:", error);
      throw error;
    }
  },

  cancelOrderAndReturnStock: async (orderId, items) => {
    try {
      await runTransaction(db, async (transaction) => {
        const productRefs = items.map(item => doc(db, productsCollection, item.productId));
        const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        // 1. Devolvemos el stock a la tienda
        productDocs.forEach((productDoc, index) => {
          if (productDoc.exists()) {
            const currentStock = productDoc.data().stock;
            const quantityToReturn = items[index].quantity;
            transaction.update(productRefs[index], { stock: currentStock + quantityToReturn });
          }
        });

        // 2. Destruimos el pedido por completo para que no ensucie la pestaña "Concluidas"
        const orderRef = doc(db, ordersCollection, orderId);
        transaction.delete(orderRef);
      });
    } catch (error) {
      console.error("Error al cancelar y devolver stock:", error);
      throw error;
    }
  },

  modifyOrderItems: async (orderId, oldItems, newItems) => {
    try {
      await runTransaction(db, async (transaction) => {
        const productIds = new Set([...oldItems.map(i => i.productId), ...newItems.map(i => i.productId)]);
        const productRefs = {};
        const productDocs = {};

        for (const pid of productIds) {
          productRefs[pid] = doc(db, productsCollection, pid);
          productDocs[pid] = await transaction.get(productRefs[pid]);
        }

        for (const pid of productIds) {
          const oldItem = oldItems.find(i => i.productId === pid) || { quantity: 0 };
          const newItem = newItems.find(i => i.productId === pid) || { quantity: 0 };
          
          const difference = newItem.quantity - oldItem.quantity; 

          if (difference !== 0) {
            if (!productDocs[pid].exists()) throw new Error(`El producto con ID ${pid} ya no existe en la BD.`);
            const currentStock = productDocs[pid].data().stock;
            
            if (currentStock < difference) throw new Error(`Stock insuficiente para agregar más unidades del producto ID: ${pid}`);
            
            transaction.update(productRefs[pid], { stock: currentStock - difference });
          }
        }

        const newTotalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderRef = doc(db, ordersCollection, orderId);
        transaction.update(orderRef, { items: newItems, totalAmount: newTotalAmount });
      });
    } catch (error) {
      console.error("Error al modificar pedido:", error);
      throw error;
    }
  }
};