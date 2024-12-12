const User = require("../models/User.js");
const bcrypt = require("bcryptjs");


const getSignedinUserProfile = async (req, res) => {
  try{
    const user = await User.findById(req.user._id).select("-password")
    res.status(200).json(user);
  } catch(error) {
    console.log("Error in getUser controller", error.message);
    res.status(500).json({error: "Internal server error"});
  }
}

const getUserProfile = async (req, res) => {
  const { email } = req.params;
    try{
        const user = await User.findOne({ email }).select("-password");
        if (!user) 
          return res.status(400).json({message: "User not found"});

        res.status(200).json(user);
    } catch (error) {
        console.log("error in getUserProfile controller:", error.message)
        res.status(500).json({error: error.message});
    }
}

const updateUserProfile = async (req, res) => {
  const { firstname, lastname, email, phonenumber, currentPassword, newPassword} = req.body;

  const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
			return res.status(400).json({ error: "Please provide both current password and new password" });
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
			if (newPassword.length < 6) {
				return res.status(400).json({ error: "Password must be at least 6 characters long" });
			}

			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}

		user.firstname = firstname || user.firstname;
    user.lastname = lastname || user.lastname;
		user.email = email || user.email;
    user.phonenumber = phonenumber || user.phonenumber;

		user = await user.save();

		user.password = null;
		return res.status(200).json(user);

  } catch (error) {
    console.log("Error in updateUser: ", error.message);
		res.status(500).json({ error: error.message });
  }
}

const getAllUsersProfile = async (req, res) => {
  try{
    const allUsers = await User.find()
    return res.status(200).json(allUsers)
  } catch (error){
    console.log("Error in getAllUsers controller: ", error.message);
		res.status(500).json({ error: error.message });
  }

  // User.find().then((data) => {
  //   console.log(data);

  //   return res.json({
  //     message: "List of Users",
  //     data
  //   })
  // }). catch(err => 
  //   console.log(err)
  // )
}

module.exports = { updateUserProfile, getSignedinUserProfile, getUserProfile, getAllUsersProfile };
