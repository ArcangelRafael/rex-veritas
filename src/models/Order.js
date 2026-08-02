export class Order {
  constructor({ id, customerName, customerPhone, customerEmail, comments, items, totalAmount, status, createdAt }) {
    this.id = id || null;
    this.customerName = customerName;
    this.customerPhone = customerPhone;
    this.customerEmail = customerEmail || ''; // Nuevo campo
    this.comments = comments || '';           // Nuevo campo
    this.items = items; 
    this.totalAmount = Number(totalAmount);
    this.status = status || 'PENDING'; 
    this.createdAt = createdAt || new Date();
  }

  toFirestore() {
    return {
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerEmail: this.customerEmail, // Nuevo campo a Firebase
      comments: this.comments,           // Nuevo campo a Firebase
      items: this.items,
      totalAmount: this.totalAmount,
      status: this.status,
      createdAt: this.createdAt
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Order({
      id: doc.id,
      ...data,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date() 
    });
  }
}