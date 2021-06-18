const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const ProjectSchema = new mongoose.Schema(
  {
    projectname: { type: String, required: [true, "can't be blank"] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, "can't be blank"], index: true },
    taglist: [{ type: String }],
  },
  { timestamps: true }
);
ProjectSchema.plugin(uniqueValidator, { message: 'is already taken.' });

ProjectSchema.methods.toJSON = function() {
  return {
    projectname: this.projectname,
    taglist: this.taglist,
  };
};

ProjectSchema.methods.toJSONforOwner = function(user) {
  return {
    projectname: this.projectname,
    owner: user.username,
    taglist: this.taglist,
  };
};

mongoose.model('Project', ProjectSchema);
