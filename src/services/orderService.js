import { collection, doc, runTransaction, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { Order } from "../models/Order";

const ordersCollection = "orders";
const productsCollection = "products";

export const orderService = {
  createOrder: async (orderData) => {
    try {
      const orderId = await runTransaction(db, async (transaction) => {
        const productIds = new Set(orderData.items.map(i => i.productId));
        const productRefs = {};
        const productDocs = {};

        for (const pid of productIds) {
          productRefs[pid] = doc(db, productsCollection, pid);
          productDocs[pid] = await transaction.get(productRefs[pid]);
        }

        const stockDeductions = {};
        orderData.items.forEach(item => {
          if (!stockDeductions[item.productId]) stockDeductions[item.productId] = { total: 0, sizes: {} };
          stockDeductions[item.productId].total += item.quantity;
          stockDeductions[item.productId].sizes[item.size] = (stockDeductions[item.productId].sizes[item.size] || 0) + item.quantity;
        });

        for (const pid of productIds) {
          const productDoc = productDocs[pid];
          if (!productDoc.exists()) throw new Error(`Uno de los productos en tu carrito ya no existe.`);
          const currentData = productDoc.data();
          const deductions = stockDeductions[pid];
          
          // NUEVO: Sumamos la cantidad vendida al historial histórico del producto
          const firestoreUpdates = { 
            stock: currentData.stock - deductions.total,
            totalSold: (currentData.totalSold || 0) + deductions.total
          };
          
          Object.entries(deductions.sizes).forEach(([size, qty]) => {
             const currentSizeStock = currentData.stockSizes && currentData.stockSizes[size] !== undefined ? currentData.stockSizes[size] : currentData.stock;
             if (currentSizeStock < qty) throw new Error(`Stock insuficiente para la talla ${size}.`);
             firestoreUpdates[`stockSizes.${size}`] = currentSizeStock - qty;
          });
          
          transaction.update(productRefs[pid], firestoreUpdates);
        }

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
      await updateDoc(orderRef, { status: 'COMPLETED' });
    } catch (error) {
      console.error("Error al completar el pedido:", error);
      throw error;
    }
  },

  cancelOrderAndReturnStock: async (orderId, items) => {
    try {
      await runTransaction(db, async (transaction) => {
        const productIds = new Set(items.map(i => i.productId));
        const productRefs = {};
        const productDocs = {};

        for (const pid of productIds) {
          productRefs[pid] = doc(db, productsCollection, pid);
          productDocs[pid] = await transaction.get(productRefs[pid]);
        }

        const stockReturns = {}; 
        items.forEach(item => {
          if (!stockReturns[item.productId]) stockReturns[item.productId] = { total: 0, sizes: {} };
          stockReturns[item.productId].total += item.quantity;
          stockReturns[item.productId].sizes[item.size] = (stockReturns[item.productId].sizes[item.size] || 0) + item.quantity;
        });

        for (const pid of productIds) {
          if (productDocs[pid].exists()) {
             const currentData = productDocs[pid].data();
             const returns = stockReturns[pid];
             
             // NUEVO: Restamos las ventas porque se canceló el pedido
             const firestoreUpdates = { 
               stock: currentData.stock + returns.total,
               totalSold: Math.max(0, (currentData.totalSold || 0) - returns.total)
             };
             
             Object.entries(returns.sizes).forEach(([size, qty]) => {
               const currentSizeStock = currentData.stockSizes && currentData.stockSizes[size] !== undefined ? currentData.stockSizes[size] : 0;
               firestoreUpdates[`stockSizes.${size}`] = currentSizeStock + qty;
             });

             transaction.update(productRefs[pid], firestoreUpdates);
          }
        }

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

        const stockUpdates = {}; 

        oldItems.forEach(item => {
          if (!stockUpdates[item.productId]) stockUpdates[item.productId] = { totalDiff: 0, sizes: {} };
          stockUpdates[item.productId].totalDiff -= item.quantity;
          stockUpdates[item.productId].sizes[item.size] = (stockUpdates[item.productId].sizes[item.size] || 0) - item.quantity;
        });

        newItems.forEach(item => {
          if (!stockUpdates[item.productId]) stockUpdates[item.productId] = { totalDiff: 0, sizes: {} };
          stockUpdates[item.productId].totalDiff += item.quantity;
          stockUpdates[item.productId].sizes[item.size] = (stockUpdates[item.productId].sizes[item.size] || 0) + item.quantity;
        });

        for (const pid of productIds) {
          const updateData = stockUpdates[pid];
          if (Object.keys(updateData.sizes).some(size => updateData.sizes[size] !== 0)) {
            if (!productDocs[pid].exists()) throw new Error(`El producto con ID ${pid} ya no existe en la BD.`);
            const currentData = productDocs[pid].data();
            
            // NUEVO: Ajustamos las ventas según la modificación
            const firestoreUpdates = { 
              stock: currentData.stock - updateData.totalDiff,
              totalSold: Math.max(0, (currentData.totalSold || 0) + updateData.totalDiff)
            };
            
            Object.entries(updateData.sizes).forEach(([size, diff]) => {
               if (diff !== 0) {
                 const currentSizeStock = currentData.stockSizes && currentData.stockSizes[size] !== undefined ? currentData.stockSizes[size] : 0;
                 if (currentSizeStock < diff) throw new Error(`Stock insuficiente para la talla ${size}`);
                 firestoreUpdates[`stockSizes.${size}`] = currentSizeStock - diff;
               }
            });
            
            transaction.update(productRefs[pid], firestoreUpdates);
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