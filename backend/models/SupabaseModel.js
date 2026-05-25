const supabase = require('../config/supabase');

class SupabaseModel {
  constructor(tableName, data = {}, relations = {}) {
    this.tableName = tableName;
    // Relations mapping for population
    this.relations = {
      'division': { table: 'divisions', foreignKey: 'division_id' },
      'tourId': { table: 'tours', foreignKey: 'tour_id' },
      ...relations
    };
    
    if (Object.keys(data).length > 0) {
      Object.assign(this, data);
      // Auto-alias _id for backward compatibility
      if (this.id && !this._id) {
        this._id = this.id;
      }
    }
    
    this.save = this.save.bind(this);
  }

  _wrap(data) {
    if (!data) return null;
    if (Array.isArray(data)) return data.map(item => this._wrap(item));

    const instance = new this.constructor(this.tableName, data);
    
    // Ensure both id and _id are present
    if (instance.id && !instance._id) {
      instance._id = instance.id;
    }
    
    // Alias timestamps for backward compatibility
    if (instance.created_at && !instance.createdAt) {
      instance.createdAt = instance.created_at;
    }
    if (instance.updated_at && !instance.updatedAt) {
      instance.updatedAt = instance.updated_at;
    }
    
    return instance;
  }

  async save() {
    const { id, _id, tableName, relations, ...updateData } = this;
    const cleanData = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (typeof value !== 'function') {
        cleanData[key] = value;
      }
    }
    
    if (id) {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      Object.assign(this, result);
    } else {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert([cleanData])
        .select()
        .single();
      if (error) throw error;
      Object.assign(this, result);
    }
    this._id = this.id;
    return this;
  }

  toJSON() {
    const obj = {};
    for (const [key, value] of Object.entries(this)) {
      if (typeof value !== 'function' && key !== 'tableName' && key !== 'relations') {
        obj[key] = value;
      }
    }
    if (obj.id && !obj._id) obj._id = obj.id;
    return obj;
  }

  toObject(options = {}) {
    return this.toJSON();
  }

  find(query = {}) {
    let request = supabase.from(this.tableName).select('*');
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        request = request.eq(key, value);
      }
    }
    
    const self = this;
    const queryObj = {
      _request: request,
      _populates: [],
      
      sort(sortQuery) {
        for (const [key, value] of Object.entries(sortQuery)) {
          this._request = this._request.order(key, { ascending: value === 1 });
        }
        return this;
      },

      populate(path, select) {
        const config = self.relations[path];
        if (config) {
          this._populates.push({ path, select, ...config });
        }
        return this;
      },

      lean() { return this; },

      async exec() {
        const { data, error } = await this._request;
        if (error) throw error;
        
        let results = self._wrap(data || []);
        
        // Handle population
        for (const pop of this._populates) {
          const ids = results.map(r => r[pop.foreignKey]).filter(Boolean);
          if (ids.length > 0) {
            // Convert space-separated Mongoose select to comma-separated Supabase select
            const selectFields = typeof pop.select === 'string' 
              ? pop.select.trim().replace(/\s+/g, ', ') 
              : pop.select || '*';

            const { data: relatedData } = await supabase
              .from(pop.table)
              .select(selectFields)
              .in('id', ids);
            
            if (relatedData) {
              const relatedMap = relatedData.reduce((acc, r) => {
                acc[r.id] = r;
                return acc;
              }, {});
              results.forEach(r => {
                r[pop.path] = relatedMap[r[pop.foreignKey]] || null;
              });
            }
          }
        }
        return results;
      },

      then(resolve, reject) {
        return this.exec().then(resolve).catch(reject);
      }
    };
    return queryObj;
  }

  findOne(query = {}) {
    let request = supabase.from(this.tableName).select('*');
    for (const [key, value] of Object.entries(query)) {
      request = request.eq(key, value);
    }
    
    const self = this;
    const queryObj = {
      _request: request.limit(1).single(),
      _populates: [],

      populate(path, select) {
        const config = self.relations[path];
        if (config) {
          this._populates.push({ path, select, ...config });
        }
        return this;
      },

      lean() { return this; },

      async exec() {
        const { data, error } = await this._request;
        if (error && error.code !== 'PGRST116') throw error;
        if (!data) return null;

        const record = self._wrap(data);
        for (const pop of this._populates) {
          const relatedId = record[pop.foreignKey];
          if (relatedId) {
            const { data: relatedData } = await supabase
              .from(pop.table)
              .select(pop.select || '*')
              .eq('id', relatedId)
              .single();
            if (relatedData) record[pop.path] = relatedData;
          }
        }
        return record;
      },

      then(resolve, reject) {
        return this.exec().then(resolve).catch(reject);
      }
    };
    return queryObj;
  }

  findById(id) {
    return this.findOne({ id });
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    const record = this._wrap(data);
    
    // Add populate to the return of update
    record.populate = async function(path, select) {
      const config = this.relations[path];
      if (config && this[config.foreignKey]) {
        const { data: related } = await supabase
          .from(config.table)
          .select(select || '*')
          .eq('id', this[config.foreignKey])
          .single();
        this[path] = related;
      }
      return this;
    };
    
    return record;
  }

  async findByIdAndDelete(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return this._wrap(data);
  }

  async findOneAndUpdate(query, updateData, options = {}) {
    if (options.upsert) {
      const { data, error } = await supabase
        .from(this.tableName)
        .upsert({ ...query, ...updateData }, { onConflict: Object.keys(query).join(',') })
        .select()
        .single();
      if (error) throw error;
      return this._wrap(data);
    }

    let request = supabase.from(this.tableName).update(updateData);
    for (const [key, value] of Object.entries(query)) {
      request = request.eq(key, value);
    }
    const { data, error } = await request.select().single();
    if (error) throw error;
    return this._wrap(data);
  }

  async create(docData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([docData])
      .select()
      .single();
    if (error) throw error;
    return this._wrap(data);
  }
}

module.exports = SupabaseModel;
