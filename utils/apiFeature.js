class ApiFeature {
  constructor(query, queryStrObj) {
    this.query = query;
    this.queryStrObj = queryStrObj;
  }

  filter() {
    let queryObj = { ...this.queryStrObj };
    const excludedFields = ['page', 'limit', 'fields', 'sort'];
    excludedFields.forEach((el) => delete queryObj[el]);
    let queryStrFormatted = JSON.stringify(queryObj);
    queryStrFormatted = queryStrFormatted.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    queryObj = JSON.parse(queryStrFormatted);

    this.query = this.query.find(queryObj);

    return this;
  }

  sort() {
    if (this.queryStrObj.sort) {
      const sort = this.queryStrObj.sort.replace(',', ' ');
      this.query = this.query.sort(sort);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryStrObj.fields) {
      const fields = this.queryStrObj.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = +this.queryStrObj.page || 1;
    const limit = +this.queryStrObj.limit || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = ApiFeature;
