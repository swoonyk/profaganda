// MongoDB Schema Definitions and Validation

export const professorSchema = {
  bsonType: 'object',
  required: ['internal_code', 'source', 'created_at'],
  properties: {
    _id: {
      bsonType: 'objectId'
    },
    internal_code: {
      bsonType: 'string',
      description: 'Unique internal identifier for the professor'
    },
    source: {
      bsonType: 'string',
      enum: ['rmp', 'cureviews'],
      description: 'Source of the professor data'
    },
    created_at: {
      bsonType: 'date',
      description: 'When the professor record was created'
    }
  }
};

export const reviewSchema = {
  bsonType: 'object',
  required: ['professor_id', 'sanitized_text', 'source', 'sanitized_at'],
  properties: {
    _id: {
      bsonType: 'objectId'
    },
    professor_id: {
      bsonType: 'string',
      description: 'ID of the professor this review is for'
    },
    sanitized_text: {
      bsonType: 'string',
      description: 'The sanitized review text with PII removed'
    },
    source: {
      bsonType: 'string',
      enum: ['rmp', 'cureviews'],
      description: 'Source of the review data'
    },
    rating: {
      bsonType: 'int',
      minimum: 1,
      maximum: 5,
      description: 'Optional rating (1-5 stars)'
    },
    sanitized_at: {
      bsonType: 'date',
      description: 'When the review was sanitized'
    }
  }
};

// Index definitions for optimal query performance
export const indexDefinitions = {
  professors: [
    { key: { internal_code: 1 }, options: { unique: true } },
    { key: { source: 1 }, options: {} },
    { key: { created_at: -1 }, options: {} }
  ],
  reviews: [
    { key: { professor_id: 1 }, options: {} },
    { key: { source: 1 }, options: {} },
    { key: { sanitized_at: -1 }, options: {} },
    { key: { professor_id: 1, sanitized_at: -1 }, options: {} }
  ]
};
