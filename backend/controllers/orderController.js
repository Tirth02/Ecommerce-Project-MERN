import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

//  Placing order using cod
const placeOrder = async(req,res) => {
    try {
        const {userId, items, amount, address} = req.body;
        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: 'cod',
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        await userModel.findByIdAndUpdate(userId,{cartData:{}});

        res.json({success: true, message:"Order Placed"});

    } catch (error) {
        console.log(error); 
        res.json({success:false, message: error.message})
    }
}  

//  Placing order using cod
const placeOrderStripe = async(req,res) => {

}       
//  Placing order using cod
const placeOrderRazorpay = async(req,res) => {

}       

// All Orders data for admin panel
const allOrders = async(req,res) => {

}
// User Order data for Frontend
const userOrders = async(req,res) => {
    try {
        const {userId} = req.body;
        const orders = await orderModel.find({userId});
        res.json({success:true,orders});

    } catch (error) {
        console.log(error);
        res.json({success: false, message:error.message});
    }

}

// Update Order status from Admin Panel
const updateStatus = async(req,res) => {

}

export {placeOrder, placeOrderRazorpay, placeOrderStripe, allOrders, userOrders, updateStatus};