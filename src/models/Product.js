export class Product {
  constructor({ id, name, brand, brands, size, price, stock, stockSizes, imageUrl, imageUrls, description, isActive, isBoosted, category, quality, releaseDate, inCartsCount, restockStatus, restockDate, totalSold }) {
    this.id = id || null;
    this.name = name;
    
    this.brands = Array.isArray(brands) ? brands : (brand ? [brand] : ['']);
    this.brand = this.brands.length > 0 ? this.brands[0] : ''; 
    
    this.stockSizes = stockSizes || { XXL: 0, XL: 0, L: 0, M: 0, CH: 0, UNITALLA: 0 };
    this.size = size || 'Varias'; 
    
    this.price = Number(price);
    
    const calculatedTotalStock = Object.values(this.stockSizes).reduce((acc, curr) => acc + Number(curr), 0);
    this.stock = calculatedTotalStock > 0 ? calculatedTotalStock : (Number(stock) || 0);
    
    this.imageUrls = Array.isArray(imageUrls) ? imageUrls : (imageUrl ? [imageUrl] : ['']);
    this.imageUrl = this.imageUrls.length > 0 ? this.imageUrls[0] : ''; 
    
    this.description = description || '';
    this.isActive = isActive !== undefined ? isActive : true;
    this.isBoosted = isBoosted !== undefined ? isBoosted : false; 
    
    this.category = category || 'Gorra';
    this.quality = quality || 'N/A';
    
    this.releaseDate = releaseDate || new Date().toISOString();
    
    this.inCartsCount = Number(inCartsCount) || 0;
    
    // NUEVO: Contador matemático directo en el producto
    this.totalSold = Number(totalSold) || 0;

    this.restockStatus = restockStatus || 'SOON'; 
    this.restockDate = restockDate || '';
  }

  hasSufficientStock(quantity) {
    return this.stock >= quantity; 
  }

  toFirestore() {
    return {
      name: this.name,
      brand: this.brand, 
      brands: this.brands, 
      size: this.size, 
      stockSizes: this.stockSizes, 
      price: this.price,
      stock: this.stock, 
      imageUrl: this.imageUrl, 
      imageUrls: this.imageUrls, 
      description: this.description,
      isActive: this.isActive,
      isBoosted: this.isBoosted, 
      category: this.category,
      quality: this.quality,
      releaseDate: this.releaseDate,
      inCartsCount: this.inCartsCount, 
      totalSold: this.totalSold, // SE GUARDA EN FIREBASE
      restockStatus: this.restockStatus, 
      restockDate: this.restockDate,     
      updatedAt: new Date()
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Product({
      id: doc.id,
      ...data
    });
  }
}