import express from "express";
import pool from "./db.js"
const app=express();
app.use(express.json());
const PORT=5000;
app.get("/",(req,res)=>{
  res.send("Server is running");
});
app.get("/db-test",async(req,res)=>{
  try{
    const result=await pool.query("SELECT NOW() as now");
    res.json({dbTime:result.rows[0].now});
  }
  catch(err){
    res.status(500).json({error:err.message});
  }
});
app.post("/expenses",async (req,res)=>{
  try
  {
    const {user_id,expense,date}=req.body;
    if(!user_id||expense==undefined||!date){
      return res.status(400).json({Error: "requirements are needed"});
    }
    const insertQuery=`INSERT INTO expense(user_id,expense,date) VALUES ($1,$2,$3) RETURNING user_id,expense,date`;
    const result=await pool.query(insertQuery,[user_id,expense,date]);
    return res.status(201).json({
      message:"Expense is added",
      data:result.rows[0]
    })
    
  }
  catch(err){
    return res.status(500).json({Error: err.message})
  }
})
app.post("/income",async (req,res)=>{
  try
  {
    const{user_id,income,date}=req.body;
    if(!user_id||income==undefined||!date){
      return res.status(400).json({Error:"requirement are not filled"});
    }
    const insertQuery=`INSERT INTO income(user_id,income,date) VALUES ($1,$2,$3) RETURNING user_id,income,date`;
    const result=await pool.query(insertQuery,[user_id,income,date]);
    return res.status(201).json({
      message:"income is successfully added",
      data:result.rows[0]
    });
  }
  catch(err){
    return res.status(500).json({Error:err.message});
  }
});

app.get("/expenses",async (req,res)=>{
  try{
    const {user_id}=req.query;
    let query;
    if(user_id){
      query=`SELECT expense_id,user_id,expense,date FROM expense WHERE user_id=$1 ORDER BY date DESC`;
    }else{
      return res.status(400).json({message:"requirmemt needed"});
    }
    const result=await pool.query(query,[user_id]);
    return res.status(200).json({
      message:"expense retrived successfull",
      data:result.rows
    });
  }
  catch(err){
    return res.status(500).json({Error: err.message});
  }
});
app.get("/income",async (req,res)=>{
  try{
  const {user_id}=req.query;
  let query;
  if(user_id){
    query=`SELECT income_id,user_id,income,date FROM income WHERE user_id=$1 ORDER BY date DESC`;
  }else{
  return res.status(400).json({message:"requirement needed"});
  }
  const result=await pool.query(query,[user_id]);
  return res.status(200).json({
    message:"successfull",
    data:result.rows
  });
  }catch(err){
    return res.status(500).json({Error:err.message});
  }
});
app.get("/balance",async (req,res)=>{
  try{
    const {user_id}=req.query;
    if(!user_id){
      return res.status(400).json({
        message:"requirements needed"
      });
    }
    const incomeResult=await pool.query("SELECT SUM(income) AS total_income FROM income WHERE user_id=$1",[user_id]);
    const expenseResult=await pool.query("SELECT SUM(expense) AS total_expense FROM expense WHERE user_id=$1",[user_id]);
    const totalIncome=incomeResult.rows[0].total_income||0;
    const totalExpense=expenseResult.rows[0].total_expense||0;
    const balance=totalIncome-totalExpense;
    return res.status(200).json({
      user_id,
      total_income:totalIncome,
      total_expense:totalExpense,
      balance
    });
  }catch(err){
    return res.status(500).json({
      Error:err.message
    });
  }
});
app.put("/expense/:expense_id",async (req,res)=>{
  try{
    const {expense_id}=req.params;
    const {expense,date}=req.body;
    if(expense===undefined||!date){
      return res.status(400).json({message:"requirments needed"});
    }
    const updateQuery="UPDATE expense SET expense=$1,date=$2 WHERE expense_id=$3 RETURNING expense_id,user_id,expense,date";
    const result=await pool.query(updateQuery,[expense,date,expense_id]);
    if(result.rows.length===0){
      return res.status(404).json({
        message:"expense not found"
      });
    }
    return res.status(200).json({
      message:"updated successfully",
      data:result.rows[0]
    });
  }
  catch(err){
    return res.status(500).json({
      Error:err.message
    });
  }
});
app.delete("/expense/:expense_id",async (req,res)=>{
  try{
    const {expense_id}=req.params;
    if(!expense_id){
      return res.status(400).json({message:"requirment missing"});
    }
    const deleteQuery="DELETE FROM expense WHERE expense_id=$1 RETURNING expense_id,user_id,expense,date";
    const result=await pool.query(deleteQuery,[expense_id]);
    if(result.rows.length===0){
      return res.status(404).json({message:"expense not found"});
    }
    return res.status(200).json({
      message:"deleted successfully",
      data:result.rows[0]
    });
  }
  catch(err){
    return res.status(500).json({Error:err.message});
  }
});
app.put("/income/:income_id",async (req,res)=>{
  try{
    const {income_id}=req.params;
    const {income,date}=req.body;
    if(income==undefined||!date){
      return res.status(400).json({message:"requirements needed"});
    }
    const updateQuery="UPDATE income SET income=$1,date=$2 WHERE income_id=$3 RETURNING income_id,user_id,income,date";
    const result=await pool.query(updateQuery,[income,date,income_id]);
    if(result.rows.length===0){
      return res.status(404).json({message:"income not found"});
    }
    return res.status(200).json({
      message:"income updated successfully",
      data:result.rows[0]
    });
  }
  catch(err){
    return res.status(500).json({Error:err.message});
  }
});
app.delete("/income/:income_id",async (req,res)=>{
  try{
    const {income_id}=req.params;
    if(!income_id){
      return res.status(400).json({message:"requiremnet not found"});
    }
    const deleteQuery="DELETE FROM income WHERE income_id=$1 RETURNING income_id,user_id,income,date";
    const result=await pool.query(deleteQuery,[income_id]);
    if(result.rows.length===0){
      return res.status(404).json({message:"income not found"});
    }
    return res.status(200).json({
      message:"income deleted successfully",
      data:result.rows[0]
    });
  }
  catch(err){
    return res.status(500).json({Error:err.message});
  }
});
app.listen(PORT,()=>{
  console.log(`server is runnig on ${PORT}`);
});
