export class Product {
  constructor({ id, name, brand, size, price, stock, imageUrl, description, isActive }) {
    this.id = id || null;
    this.name = name;
    this.brand = brand;
    this.size = size;
    this.price = Number(price);
    this.stock = Number(stock);
    this.imageUrl = imageUrl || '';
    this.description = description || '';
    this.isActive = isActive !== undefined ? isActive : true;
  }

  // Comprueba si hay stock suficiente
  hasSufficientStock(quantity) {
    return this.stock >= quantity;
  }

  // Prepara el objeto para guardarlo en Firebase (sin el ID, porque Firestore lo asigna al documento)
  toFirestore() {
    return {
      name: this.name,
      brand: this.brand,
      size: this.size,
      price: this.price,
      stock: this.stock,
      imageUrl: this.imageUrl,
      description: this.description,
      isActive: this.isActive,
      updatedAt: new Date()
    };
  }

  // Fabrica una instancia de Product a partir de un documento de Firebase
  static fromFirestore(doc) {
    const data = doc.data();
    return new Product({
      id: doc.id,
      ...data
    });
  }
}