export class Message {
  constructor({ id, phone, subject, text, isRead, isArchived, createdAt }) {
    this.id = id || null;
    this.phone = phone;
    this.subject = subject;
    this.text = text;
    this.isRead = isRead || false;
    this.isArchived = isArchived || false; // NUEVO CAMPO
    
    this.createdAt = createdAt?.toDate ? createdAt.toDate() : (createdAt ? new Date(createdAt) : new Date());
  }

  toFirestore() {
    return {
      phone: this.phone,
      subject: this.subject,
      text: this.text,
      isRead: this.isRead,
      isArchived: this.isArchived, // SE GUARDA EN FIREBASE
      createdAt: this.createdAt || new Date()
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Message({
      id: doc.id,
      ...data
    });
  }
}