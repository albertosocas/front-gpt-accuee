const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  prompt: {type: String, required: true, trim: true},
  evaluator_id: {type: String,unique: true,required: true},
  gpt_manager: {type: String,required: true},
  query_batch_length: {type: Number,required: true},
  description: {type: String,trim: true,default: ''},
  temperature: {type: Number,required: true},
  evaluation: {type: mongoose.Schema.Types.Mixed,default: null },
  user_id: { type: mongoose.Schema.Types.ObjectId,ref: 'User',required: true},
  createdAt: {type: Date,default: Date.now}
});

module.exports = mongoose.model('Prompt', promptSchema);
