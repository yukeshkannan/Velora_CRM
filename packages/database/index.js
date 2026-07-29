const mongoose = require('mongoose');

const connectDB = async (uri, serviceName = '') => {
  let targetUri = uri;

  if (targetUri && serviceName) {
    const formattedName = serviceName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_service$/, '');
    const dbName = `aura_${formattedName}_db`;
    
    if (targetUri.includes('/companycrm')) {
      targetUri = targetUri.replace('/companycrm', `/${dbName}`);
    } else {
      const urlParts = targetUri.split('?');
      const basePart = urlParts[0];
      const queryPart = urlParts[1] ? `?${urlParts[1]}` : '';
      
      const lastSlash = basePart.lastIndexOf('/');
      if (lastSlash > 8) {
        const existingDb = basePart.substring(lastSlash + 1);
        if (!existingDb || existingDb === 'test' || existingDb === 'admin') {
          targetUri = basePart.substring(0, lastSlash + 1) + dbName + queryPart;
        }
      } else {
        targetUri = `${basePart}/${dbName}${queryPart}`;
      }
    }
  }

  if (!targetUri) {
    console.error(`[${serviceName || 'DB'}] MongoDB URI is missing`);
    return;
  }

  try {
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[${serviceName || 'DB'}] MongoDB Connected: ${mongoose.connection.host}/${mongoose.connection.name || ''}`);
  } catch (error) {
    console.error(`[${serviceName || 'DB'}] MongoDB Connection Warning: ${error.message}`);
    console.log(`[${serviceName || 'DB'}] Server is running in OFFLINE DEVELOPER MODE. In-memory fallback is active.`);
  }
};


// ==========================================
// OFFLINE DATABASE EMULATOR (In-Memory)
// ==========================================
const offlineStore = {
  User: [
    {
      _id: new mongoose.Types.ObjectId('65beefc1d9b3a5a7d7f7a111'),
      name: 'Admin User',
      email: 'admin@company.com',
      role: 'Admin',
      designation: 'System Administrator',
      department: 'IT',
      salary: 120000,
      profilePic: '',
      createdAt: new Date('2026-01-01')
    },
    {
      _id: new mongoose.Types.ObjectId('65beefc1d9b3a5a7d7f7a222'),
      name: 'John Doe',
      email: 'employee@company.com',
      role: 'Employee',
      designation: 'Software Engineer',
      department: 'Engineering',
      salary: 80000,
      profilePic: '',
      createdAt: new Date('2026-01-01')
    }
  ],
  Product: [
    {
      _id: new mongoose.Types.ObjectId('65beefc1d9b3a5a7d7f7b111'),
      name: 'Standard Website Package',
      sku: 'WEB-STD-001',
      price: 1500,
      description: '5-page responsive website with contact form',
      category: 'Service',
      stock: 100,
      createdAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId('65beefc1d9b3a5a7d7f7b222'),
      name: 'E-commerce Add-on',
      sku: 'WEB-ECOM-001',
      price: 2500,
      description: 'Shopping cart integration with payment gateway',
      category: 'Service',
      stock: 100,
      createdAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId('65beefc1d9b3a5a7d7f7b333'),
      name: 'Annual Maintenance',
      sku: 'MNT-YR-001',
      price: 500,
      description: 'Yearly server maintenance and updates',
      category: 'Subscription',
      stock: 1000,
      createdAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId('65beefc1d9b3a5a7d7f7b444'),
      name: 'CRM Premium License',
      sku: 'SW-CRM-PREM',
      price: 150,
      description: 'Per user monthly license for premium features',
      category: 'Software',
      stock: 9999,
      createdAt: new Date()
    }
  ],
  Contact: [],
  Invoice: [],
  Ticket: [],
  Opportunity: [],
  Attendance: [],
  Payroll: [],
  Task: []
};

// Generic matching helper
const filterOffline = (modelName, queryObj) => {
  let list = offlineStore[modelName] || [];
  if (queryObj && Object.keys(queryObj).length > 0) {
    list = list.filter(item => {
      for (const key in queryObj) {
        let qVal = queryObj[key];
        
        // Handle MongoDB operators like $or, $and
        if (key.startsWith('$')) continue;
        
        let itemVal = item[key];
        
        if (qVal && typeof qVal === 'object' && !mongoose.Types.ObjectId.isValid(qVal)) {
          if (qVal instanceof RegExp) {
            if (!itemVal || !qVal.test(itemVal.toString())) return false;
            continue;
          }
          if (qVal.$regex) {
            const pattern = qVal.$regex;
            const options = qVal.$options || '';
            const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, options);
            if (!itemVal || !regex.test(itemVal.toString())) return false;
            continue;
          }
          // Handle nested objects or operators like $gt, $lt, $in, $exists
          if (qVal.$in && Array.isArray(qVal.$in)) {
            const mappedIn = qVal.$in.map(v => v ? v.toString() : '');
            if (!mappedIn.includes(itemVal ? itemVal.toString() : '')) return false;
            continue;
          }
          if (qVal.$exists !== undefined) {
             const exists = qVal.$exists;
             if (exists && itemVal === undefined) return false;
             if (!exists && itemVal !== undefined) return false;
             continue;
          }
          // Simple match fallback
          continue;
        }

        if (qVal && qVal.toString) qVal = qVal.toString();
        if (itemVal && itemVal.toString) itemVal = itemVal.toString();
        
        if (itemVal !== qVal) {
          // Double-check date comparison (e.g. comparing 00:00:00 date with current date string)
          if (key === 'date' && qVal && itemVal) {
             const d1 = new Date(qVal).toDateString();
             const d2 = new Date(itemVal).toDateString();
             if (d1 === d2) continue; 
          }
          return false;
        }
      }
      return true;
    });
  }
  return list;
};

// Monkey-patch Query.prototype.exec
const originalExec = mongoose.Query.prototype.exec;
mongoose.Query.prototype.exec = async function() {
  if (mongoose.connection.readyState !== 1) {
    const modelName = this.model.modelName;
    const op = this.op;
    const queryObj = this.getQuery();
    const updateData = this.getUpdate();
    
    console.log(`[Offline DB] Intercepting Query -> Model: ${modelName}, Op: ${op}, Query:`, JSON.stringify(queryObj));
    
    if (!offlineStore[modelName]) {
      offlineStore[modelName] = [];
    }
    
    const populates = this.getPopulate ? this.getPopulate() : (this._populates || {});
    
    const processItem = (item) => {
      const doc = new this.model(item);
      
      // Manual populate helper
      if (populates && Object.keys(populates).length > 0) {
        for (const popKey in populates) {
          const popOpt = populates[popKey];
          const pathName = popOpt.path || popKey;
          const refModelName = this.model.schema.path(pathName)?.options?.ref;
          if (refModelName && doc[pathName]) {
            const refId = doc[pathName].toString();
            const refItem = (offlineStore[refModelName] || []).find(r => r._id.toString() === refId);
            if (refItem) {
              const RefModel = mongoose.model(refModelName);
              doc[pathName] = new RefModel(refItem);
            }
          }
        }
      }
      return doc;
    };
    
    if (op === 'find') {
      const results = filterOffline(modelName, queryObj);
      return results.map(processItem);
    }
    
    if (op === 'findOne' || op === 'findById') {
      const results = filterOffline(modelName, queryObj);
      if (results.length > 0) {
        return processItem(results[0]);
      }
      return null;
    }
    
    if (op === 'countDocuments' || op === 'count') {
      const results = filterOffline(modelName, queryObj);
      return results.length;
    }
    
    if (op === 'findOneAndUpdate' || op === 'findByIdAndUpdate') {
      const results = filterOffline(modelName, queryObj);
      if (results.length > 0) {
        const item = results[0];
        let setVals = updateData;
        if (updateData) {
          if (updateData.$set) setVals = updateData.$set;
          if (updateData.$push) {
            for (const pKey in updateData.$push) {
              if (!Array.isArray(item[pKey])) item[pKey] = [];
              item[pKey].push(updateData.$push[pKey]);
            }
          }
        }
        Object.assign(item, setVals);
        return processItem(item);
      }
      return null;
    }
    
    if (op === 'deleteOne' || op === 'deleteMany' || op === 'findOneAndDelete' || op === 'findByIdAndDelete') {
      const results = filterOffline(modelName, queryObj);
      if (results.length > 0) {
        const item = results[0];
        offlineStore[modelName] = offlineStore[modelName].filter(
          doc => doc._id.toString() !== item._id.toString()
        );
        return op.includes('Delete') ? processItem(item) : { acknowledged: true, deletedCount: 1 };
      }
      return op.includes('Delete') ? null : { acknowledged: true, deletedCount: 0 };
    }
    
    if (op === 'updateOne' || op === 'updateMany') {
      const results = filterOffline(modelName, queryObj);
      if (results.length > 0) {
        let setVals = updateData;
        if (updateData && updateData.$set) setVals = updateData.$set;
        results.forEach(item => Object.assign(item, setVals));
        return { acknowledged: true, modifiedCount: results.length, matchedCount: results.length };
      }
      return { acknowledged: true, modifiedCount: 0, matchedCount: 0 };
    }
  }
  return originalExec.apply(this, arguments);
};

// Monkey-patch Document.prototype.save and Model.prototype.save
const originalSave = mongoose.Model.prototype.save || mongoose.Document.prototype.save;
const offlineSave = async function() {
  if (mongoose.connection.readyState !== 1) {
    const modelName = this.constructor.modelName || this.modelName;
    console.log(`[Offline DB] Intercepting Save -> Model: ${modelName}`);
    
    if (!offlineStore[modelName]) {
      offlineStore[modelName] = [];
    }
    
    const docData = this.toObject();
    if (!docData._id) {
      docData._id = new mongoose.Types.ObjectId();
      this._id = docData._id;
    }
    
    const existingIndex = offlineStore[modelName].findIndex(
      item => item._id.toString() === docData._id.toString()
    );
    
    if (existingIndex > -1) {
      offlineStore[modelName][existingIndex] = docData;
    } else {
      offlineStore[modelName].push(docData);
    }
    
    return this;
  }
  return originalSave.apply(this, arguments);
};

if (mongoose.Document.prototype) {
  mongoose.Document.prototype.save = offlineSave;
}
if (mongoose.Model.prototype) {
  mongoose.Model.prototype.save = offlineSave;
}

// Monkey-patch Model.create
const originalCreate = mongoose.Model.create;
mongoose.Model.create = async function(docs, ...options) {
  if (mongoose.connection.readyState !== 1) {
    const modelName = this.modelName;
    console.log(`[Offline DB] Intercepting Model.create -> Model: ${modelName}`);
    
    if (!offlineStore[modelName]) {
      offlineStore[modelName] = [];
    }
    
    let docsArray = [];
    if (Array.isArray(docs)) {
      docsArray = docs;
    } else if (typeof docs === 'object' && docs !== null) {
      docsArray = [docs, ...options.filter(o => typeof o === 'object' && o !== null && !o.session)];
    } else {
      docsArray = [];
    }
    
    const instantiated = docsArray.map(d => {
      const doc = new this(d);
      if (!doc._id) doc._id = new mongoose.Types.ObjectId();
      offlineStore[modelName].push(doc.toObject());
      return doc;
    });
    
    return Array.isArray(docs) ? instantiated : instantiated[0];
  }
  return originalCreate.apply(this, arguments);
};

// Monkey-patch Model.insertMany
const originalInsertMany = mongoose.Model.insertMany;
mongoose.Model.insertMany = async function(docs) {
  if (mongoose.connection.readyState !== 1) {
    const modelName = this.modelName;
    console.log(`[Offline DB] Intercepting insertMany -> Model: ${modelName}`);
    
    if (!offlineStore[modelName]) {
      offlineStore[modelName] = [];
    }
    
    const arrayDocs = Array.isArray(docs) ? docs : [docs];
    const instantiated = arrayDocs.map(d => {
      const doc = new this(d);
      if (!doc._id) doc._id = new mongoose.Types.ObjectId();
      offlineStore[modelName].push(doc.toObject());
      return doc;
    });
    
    return instantiated;
  }
  return originalInsertMany.apply(this, arguments);
};

module.exports = { connectDB, mongoose };
