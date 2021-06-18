const router = require('express').Router();
const mongoose = require('mongoose');
const Project = mongoose.model('Project');
//const User = mongoose.model('User');
const auth = require('../auth');

//check Permission
const checkPermission = function(req, res, next) {
  try {
    if (req.project.owner.toString() !== req.jwtpayload.id) {
      throw new Error('Permission denied');
    }
    next();
  } catch (err) {
    err.status = 403;
    next(err);
  }
};

router.param('projectname', async function(req, res, next, projectname) {
  try {
    const project = await Project.findOne({ owner: req.user, projectname: projectname });
    if (!project) throw new Error('Not Found');
    req.project = project;
    next();
  } catch (err) {
    err.status = 404;
    next(err);
  }
});

router.get('/', auth.userrequired, async (req, res, next) => {
  try {
    const project = await Project.find({ owner: req.user.id });
    return res.status(200).json({ projects: project.map((project) => project.toJSONforOwner(req.user)) });
  } catch (err) {
    next(err);
  }
});
router.post('/', auth.userrequired, async (req, res, next) => {
  const { projectname, taglist } = req.body;
  try {
    if (await Project.findOne({ owner: req.user, projectname }).exec()) {
      throw new Error('projectname is already taken.');
    }
    const project = new Project({ projectname, owner: req.user, taglist });
    await project.save();
    return res.status(201).json({ project: project.toJSONforOwner(req.user) });
  } catch (err) {
    err.status = 422;
    next(err);
  }
});

router.get('/:projectname', auth.userrequired, checkPermission, async (req, res) => {
  return res.json({ project: req.project.toJSONforOwner(req.user) });
});

router.put('/:projectname', auth.userrequired, checkPermission, async (req, res, next) => {
  const { projectname, taglist } = req.body;
  try {
    const project = req.project;
    if (projectname) {
      if (await Project.findOne({ owner: req.user, projectname }).exec()) {
        throw new Error('projectname is already taken.');
      }
      project.projectname = projectname;
    }
    if (taglist) project.taglist = taglist;
    project.save();
    return res.json({ project: project.toJSONforOwner(req.user) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:projectname', auth.userrequired, checkPermission, async (req, res, next) => {
  try {
    const project = req.project;
    project.save();
    return res.json({ project: project.toJSONforOwner(req.user) });
  } catch (err) {
    next(err);
  }
});

router.use('/:projectname/devices', require('./devices'));

module.exports = router;
