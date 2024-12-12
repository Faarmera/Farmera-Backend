const Role = require("../models/Role.js")
const express = require('express');
const User = require('../models/User.js');

const seedRoles = async () => {
    try {
      const roles = ['admin', 'buyer', 'farmer'];
      for (const role of roles) {
        const roleExists = await Role.findOne({ name: role });
        if (!roleExists) {
          await Role.create({ name: role });
        }
      }
      console.log('Roles seeded successfully');
    } catch (error) {
      console.error('Error seeding roles:', error);
    }
};

const getRole = async (req, res) => {
    try {
        const { id } = req.params;
    
        const user = await User.findById(id).populate('role');
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        if (!user.role) {
          return res.status(404).json({ error: 'Role not assigned to this user' });
        }
    
        res.status(200).json({
          message: 'User role fetched successfully',
          userId: user._id,
          role: user.role.name,
        });
      } catch (error) {
        console.error('Error fetching user role:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    
}

module.exports = { seedRoles, getRole }

  
  