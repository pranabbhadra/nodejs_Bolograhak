const util = require('util');
const db = require('./config');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const useragent = require('useragent');
const requestIp = require('request-ip');
const axios = require('axios');
const mdlconfig = require('./config-module');
const slugify = require('slugify');

dotenv.config({ path: './.env' });
const query = util.promisify(db.query).bind(db);

//-- Fetch faq_pages data --------//
async function getFaqPage() {
  try {
    // Check if the company Name already exists in the "company" table
    const faq_pages_fetch_query = "SELECT * FROM faq_pages WHERE 1";
    const faq_pages__results = await query(faq_pages_fetch_query);
    if (faq_pages__results.length > 0) {
      //return faq_pages info
      return faq_pages__results[0];
    } else {

    }
  }
  catch (error) {
    console.error('Error during fetching faq_pages:', error);
  }
};

//-- Fetch  faq_categories data --------//
async function getFaqCategories() {
  try {
    // Check if the company Name already exists in the "company" table
    const faq_categories_fetch_query = "SELECT * FROM faq_categories WHERE 1";
    const faq_categories__results = await query(faq_categories_fetch_query);
    if (faq_categories__results.length > 0) {
      //return faq_categories info
      return faq_categories__results;
    } else {

    }
  }
  catch (error) {
    console.error('Error during fetching faq_categories:', error);
  }
};

//-- Fetch  faq_item data --------//
async function getFaqItems() {
  try {
    // Check if the company Name already exists in the "company" table
    const faq_items_fetch_query = "SELECT * FROM faq_item WHERE 1";
    const faq_items__results = await query(faq_items_fetch_query);
    if (faq_items__results.length > 0) {
      //return faq_categories info
      return faq_items__results;
    } else {

    }
  }
  catch (error) {
    console.error('Error during fetching faq_item:', error);
  }
};

//Insert Business Fature content
function insertBusinessFeature(content,image){
  try {
      const insert_query = `INSERT INTO business_features ( content, image, existing_or_upcoming) VALUES (?,?,'existing')`;
      const insert_data = [content,image];
      query(insert_query,insert_data);
  } catch (error) {
    console.error('Error during Inserting Business Fature content:', error);
  }
}

//Insert Business Upcoming Fature content
function insertBusinessUpcomingFeature(content){
  try {
      const insert_query = `INSERT INTO business_features ( content,  existing_or_upcoming) VALUES (?,'upcoming')`;
      const insert_data = [content];
      query(insert_query,insert_data);
  } catch (error) {
    console.error('Error during Inserting Business Fature content:', error);
  }
}
//Delete Business Upcoming Fature content
function deleteBusinessUpcomingFeature(content){
  try {
    const delete_query = `DELETE FROM business_features WHERE existing_or_upcoming = 'upcoming'`;
    query(delete_query);
  } catch (error) {
    console.error('Error during Inserting Business Fature content:', error);
  }
}

//Delete Business Fature content
function deleteBusinessFeature(content){
  try {
    const delete_query = `DELETE FROM business_features WHERE existing_or_upcoming = 'existing'`;
    query(delete_query);
  } catch (error) {
    console.error('Error during Inserting Business Fature content:', error);
  }
}

//-- Fetch  Business Fature content --------//
async function getBusinessFeature() {
  try {
    // Check if the company Name already exists in the "company" table
    const faq_items_fetch_query = "SELECT * FROM business_features WHERE existing_or_upcoming = 'existing'";
    const faq_items__results = await query(faq_items_fetch_query);
    if (faq_items__results.length > 0) {
      //return faq_categories info
      return faq_items__results;
    } else {

    }
  }
  catch (error) {
    console.error('Error during fetching faq_item:', error);
  }
};

//-- Fetch Upcoming Business Fature content --------//
async function getUpcomingBusinessFeature() {
  try {
    // Check if the company Name already exists in the "company" table
    const faq_items_fetch_query = "SELECT * FROM business_features WHERE existing_or_upcoming = 'upcoming'";
    const faq_items__results = await query(faq_items_fetch_query);
    if (faq_items__results.length > 0) {
      //return faq_categories info
      return faq_items__results;
    } else {

    }
  }
  catch (error) {
    console.error('Error during fetching faq_item:', error);
  }
};

// Function to fetch user Reviewed Companies from the  reviews table
function getReviewedCompanies(userId) {
  return new Promise((resolve, reject) => {
    const reviewed_companies_query = `
            SELECT reviews.company_id, reviews.customer_id, c.company_name as company_name, c.logo as logo, c.slug
            FROM  reviews 
            JOIN company c ON reviews.company_id = c.ID
            WHERE reviews.customer_id = ?
            GROUP BY  reviews.company_id
        `;
    db.query(reviewed_companies_query, [userId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Function to fetch user All Companies Reviews  from the  reviews table
function getAllCompaniesReviews(userId) {
  return new Promise((resolve, reject) => {
    const reviewed_companies_query = `
            SELECT r.*, c.company_name as company_name, c.logo as logo, c.slug, COUNT(review_reply.id) as review_reply_count
            FROM  reviews r
            JOIN company c ON r.company_id = c.ID
            LEFT JOIN review_reply ON review_reply.review_id = r.id
            WHERE r.customer_id = ?
            GROUP BY r.id
            ORDER BY updated_at DESC
        `;
    db.query(reviewed_companies_query, [userId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Function to fetch user All Companies Reviews tags from the  review_tag_relation table
function getAllReviewTags() {
  return new Promise((resolve, reject) => {
    const reviewed_companies_query = `
            SELECT review_id,tag_name
            FROM  review_tag_relation 
            WHERE 1 `;
    db.query(reviewed_companies_query,  (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

//Function to fetch latest Reviews from the  reviews,company,company_location,users,user_customer_meta table
async function getlatestReviews(reviewCount){
  const get_latest_review_query = `
    SELECT r.*, c.company_name, c.logo, c.slug, cl.address, cl.country, cl.state, cl.city, cl.zip, u.first_name, 
    u.last_name, u.user_id, u.user_status, ucm.profile_pic, COUNT(review_reply.id) as review_reply_count
      FROM reviews r
      LEFT JOIN company c ON r.company_id = c.ID 
      LEFT JOIN company_location cl ON r.company_location_id = cl.ID 
      LEFT JOIN users u ON r.customer_id = u.user_id 
      LEFT JOIN user_customer_meta ucm ON ucm.user_id = u.user_id 
      LEFT JOIN review_reply ON review_reply.review_id = r.id
      WHERE r.review_status = "1" AND c.status = "1" 
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT ${reviewCount};
  `;
  try{
    const get_latest_review_results = await query(get_latest_review_query);
    if(get_latest_review_results.length > 0 ){
      //console.log(get_latest_review_results);
      return get_latest_review_results;
    }else{
      return [];
    }
  }catch(error){
    console.error('Error during user get_latest_review_query:', error);
  }
  
}

//Function to fetch All Trending Reviews from the  reviews,company,company_location,users,user_customer_meta table
async function getAllTrendingReviews(){
  const get_latest_review_query = `
    SELECT r.*, c.company_name, c.logo, c.slug, cl.address, cl.country, cl.state, cl.city, cl.zip, u.first_name, 
    u.last_name, u.user_id, u.user_status, ucm.profile_pic, COUNT(review_reply.id) as review_reply_count
      FROM reviews r
      LEFT JOIN company c ON r.company_id = c.ID 
      LEFT JOIN company_location cl ON r.company_location_id = cl.ID 
      LEFT JOIN users u ON r.customer_id = u.user_id 
      LEFT JOIN user_customer_meta ucm ON ucm.user_id = u.user_id 
      LEFT JOIN review_reply ON review_reply.review_id = r.id
      WHERE r.review_status = "1" AND c.status = "1" AND c.trending = "1"
      GROUP BY r.id
      ORDER BY r.created_at DESC
  `;
  try{
    const get_latest_review_results = await query(get_latest_review_query);
    if(get_latest_review_results.length > 0 ){
      //console.log(get_latest_review_results);
      return get_latest_review_results;
    }else{
      return [];
    }
  }catch(error){
    console.error('Error during user get_latest_review_query:', error);
  }
  
}

//Function to fetch All  Reviews from the  reviews,company,company_location,users,user_customer_meta table
async function getAllReviews(){
  const get_latest_review_query = `
    SELECT r.*, c.company_name, c.logo, c.slug, cl.address, cl.country, cl.state, cl.city, cl.zip, u.first_name, 
    u.last_name, u.user_id, u.user_status, ucm.profile_pic, COUNT(review_reply.id) as review_reply_count
      FROM reviews r
      LEFT JOIN company c ON r.company_id = c.ID 
      LEFT JOIN company_location cl ON r.company_location_id = cl.ID 
      LEFT JOIN users u ON r.customer_id = u.user_id 
      LEFT JOIN user_customer_meta ucm ON ucm.user_id = u.user_id 
      LEFT JOIN review_reply ON review_reply.review_id = r.id
      WHERE r.review_status = "1" AND c.status = "1"
      GROUP BY r.id
      ORDER BY r.created_at DESC
  `;
  try{
    const get_latest_review_results = await query(get_latest_review_query);
    if(get_latest_review_results.length > 0 ){
      //console.log(get_latest_review_results);
      return get_latest_review_results;
    }else{
      return [];
    }
  }catch(error){
    console.error('Error during user get_latest_review_query:', error);
  }
  
}


//Function to fetch Page Info Content from the  page_info table
async function getPageInfo(pageName){
  try{
    const sql = `SELECT * FROM page_info where secret_Key = '${pageName}' `;
        const get_page_info_result = await query(sql);
    return get_page_info_result[0];
  }catch(error){
    console.error('Error during user get_latest_review_query:', error);
  }
}

//Function to fetch Page Meta Values from the  page_meta table
async function getPageMetaValues(pageName) {
  const sql = `SELECT * FROM page_info where secret_Key = '${pageName}' `;
  const get_page_info_result = await query(sql);

  const meta_sql = `SELECT * FROM page_meta where page_id = ${get_page_info_result[0].id}`;
  const get_page_meta_result = await query(meta_sql);
  let meta_values_array = {};
    await get_page_meta_result.forEach((item) => {
        meta_values_array[item.page_meta_key] = item.page_meta_value;
    })
    return meta_values_array;
}

//Function to send mail to client after approve
async function reviewApprovedEmail(req) {
  //console.log(req);

  const sql = `
    SELECT r.created_at, r.company_id, c.company_name, u.first_name, u.email, claimed_user.email claimed_user_email, claimed_user.first_name claimed_user_name
    FROM reviews r
    LEFT JOIN company c ON r.company_id = c.ID 
    LEFT JOIN users u ON r.customer_id = u.user_id 
    LEFT JOIN company_claim_request ccr ON ccr.company_id = c.ID 
    LEFT JOIN users claimed_user ON ccr.claimed_by = claimed_user.user_id 
    WHERE r.review_status = "1" AND r.id = "${req.review_id}"
`;

  const approveReviewData = await query(sql);


  if(approveReviewData.length > 0){
    const dateString = approveReviewData[0].created_at; 
    const date = new Date(dateString); 
    const reviewDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' ,hour:'numeric',minute:'numeric',second: 'numeric' })
  
    //console.log('approve Function', reviewData)
    var mailOptions = {
      from: process.env.MAIL_USER,
      //to: 'pranab@scwebtech.com',
      to: approveReviewData[0].email,
      subject: 'Review Approval Email',
      html: `<div id="wrapper" dir="ltr" style="background-color: #f5f5f5; margin: 0; padding: 70px 0 70px 0; -webkit-text-size-adjust: none !important; width: 100%;">
      <table height="100%" border="0" cellpadding="0" cellspacing="0" width="100%">
       <tbody>
        <tr>
         <td align="center" valign="top">
           <div id="template_header_image"><p style="margin-top: 0;"></p></div>
           <table id="template_container" style="box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important; background-color: #fdfdfd; border: 1px solid #dcdcdc; border-radius: 3px !important;" border="0" cellpadding="0" cellspacing="0" width="600">
            <tbody>
              <tr>
               <td align="center" valign="top">
                 <!-- Header -->
                 <table id="template_header" style="background-color: #000; border-radius: 3px 3px 0 0 !important; color: #ffffff; border-bottom: 0; font-weight: bold; line-height: 100%; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif;" border="0" cellpadding="0" cellspacing="0" width="600">
                   <tbody>
                     <tr>
                     <td><img alt="Logo" src="${process.env.MAIN_URL}assets/media/logos/email-template-logo.png"  style="padding: 30px 40px; display: block;  width: 70px;" /></td>
                      <td id="header_wrapper" style="padding: 36px 48px; display: block;">
                         <h1 style="color: #FCCB06; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 30px; font-weight: bold; line-height: 150%; margin: 0; text-align: left;">Review approved</h1>
                      </td>

                     </tr>
                   </tbody>
                 </table>
           <!-- End Header -->
           </td>
              </tr>
              <tr>
               <td align="center" valign="top">
                 <!-- Body -->
                 <table id="template_body" border="0" cellpadding="0" cellspacing="0" width="600">
                   <tbody>
                     <tr>
                      <td id="body_content" style="background-color: #fdfdfd;" valign="top">
                        <!-- Content -->
                        <table border="0" cellpadding="20" cellspacing="0" width="100%">
                         <tbody>
                          <tr>
                           <td style="padding: 48px;" valign="top">
                             <div id="body_content_inner" style="color: #737373; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 14px; line-height: 150%; text-align: left;">
                              
                              <table border="0" cellpadding="4" cellspacing="0" width="90%">
                                <tr>
                                  <td colspan="2">
                                  <strong>Hello ${approveReviewData[0].first_name},</strong>
                                  <p style="font-size:15px; line-height:20px">Your review for <i><b>"${approveReviewData[0].company_name} on ${reviewDate}"</b></i> has been approved. Now you can see your review on the <a href="${process.env.MAIN_URL}company/${approveReviewData[0].company_id}">website</a>.</p>
                                  </td>
                                </tr>
                              </table>
                              
                             </div>
                           </td>
                          </tr>
                         </tbody>
                        </table>
                      <!-- End Content -->
                      </td>
                     </tr>
                   </tbody>
                 </table>
               <!-- End Body -->
               </td>
              </tr>
              <tr>
               <td align="center" valign="top">
                 <!-- Footer -->
                 <table id="template_footer" border="0" cellpadding="10" cellspacing="0" width="600">
                  <tbody>
                   <tr>
                    <td style="padding: 0; -webkit-border-radius: 6px;" valign="top">
                     <table border="0" cellpadding="10" cellspacing="0" width="100%">
                       <tbody>
                         <tr>
                          <td colspan="2" id="credit" style="padding: 20px 10px 20px 10px; -webkit-border-radius: 0px; border: 0; color: #fff; font-family: Arial; font-size: 12px; line-height: 125%; text-align: center; background:#000" valign="middle">
                               <p>This email was sent from <a style="color:#FCCB06" href="${process.env.MAIN_URL}">BoloGrahak</a></p>
                          </td>
                         </tr>
                       </tbody>
                     </table>
                    </td>
                   </tr>
                  </tbody>
                 </table>
               <!-- End Footer -->
               </td>
              </tr>
            </tbody>
           </table>
         </td>
        </tr>
       </tbody>
      </table>
     </div>`
    }
      await mdlconfig.transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.log(err);
            return res.send({
                status: 'not ok',
                message: 'Something went wrong'
            });
        } else {
            console.log('Mail Send: ', info.response);
            return res.send({
                status: 'ok',
                message: 'Review Approve'
            });
        }
      })
    
      if(approveReviewData[0].claimed_user_email != null){
        var claimed_user_mail = {
          from: process.env.MAIL_USER,
          //to: 'pranab@scwebtech.com',
          to: approveReviewData[0].claimed_user_email,
          subject: 'Add a new review',
          html: `<div id="wrapper" dir="ltr" style="background-color: #f5f5f5; margin: 0; padding: 70px 0 70px 0; -webkit-text-size-adjust: none !important; width: 100%;">
          <table height="100%" border="0" cellpadding="0" cellspacing="0" width="100%">
           <tbody>
            <tr>
             <td align="center" valign="top">
               <div id="template_header_image"><p style="margin-top: 0;"></p></div>
               <table id="template_container" style="box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important; background-color: #fdfdfd; border: 1px solid #dcdcdc; border-radius: 3px !important;" border="0" cellpadding="0" cellspacing="0" width="600">
                <tbody>
                  <tr>
                   <td align="center" valign="top">
                     <!-- Header -->
                     <table id="template_header" style="background-color: #000; border-radius: 3px 3px 0 0 !important; color: #ffffff; border-bottom: 0; font-weight: bold; line-height: 100%; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif;" border="0" cellpadding="0" cellspacing="0" width="600">
                       <tbody>
                         <tr>
                         <td><img alt="Logo" src="${process.env.MAIN_URL}assets/media/logos/email-template-logo.png"  style="padding: 30px 40px; display: block;  width: 70px;" /></td>
                          <td id="header_wrapper" style="padding: 36px 48px; display: block;">
                             <h1 style="color: #FCCB06; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 30px; font-weight: bold; line-height: 150%; margin: 0; text-align: left;">Review received</h1>
                          </td>
    
                         </tr>
                       </tbody>
                     </table>
               <!-- End Header -->
               </td>
                  </tr>
                  <tr>
                   <td align="center" valign="top">
                     <!-- Body -->
                     <table id="template_body" border="0" cellpadding="0" cellspacing="0" width="600">
                       <tbody>
                         <tr>
                          <td id="body_content" style="background-color: #fdfdfd;" valign="top">
                            <!-- Content -->
                            <table border="0" cellpadding="20" cellspacing="0" width="100%">
                             <tbody>
                              <tr>
                               <td style="padding: 48px;" valign="top">
                                 <div id="body_content_inner" style="color: #737373; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 14px; line-height: 150%; text-align: left;">
                                  
                                  <table border="0" cellpadding="4" cellspacing="0" width="90%">
                                    <tr>
                                      <td colspan="2">
                                      <strong>Hello ${approveReviewData[0].claimed_user_name},</strong>
                                      <p style="font-size:15px; line-height:20px">A user reviewed on your organization <i><b>"on ${reviewDate}"</b></i>. Now you can see this review on the <a style="color:#FCCB06" href="${process.env.MAIN_URL}">BoloGrahak</a> website.</p>
                                      </td>
                                    </tr>
                                  </table>
                                  
                                 </div>
                               </td>
                              </tr>
                             </tbody>
                            </table>
                          <!-- End Content -->
                          </td>
                         </tr>
                       </tbody>
                     </table>
                   <!-- End Body -->
                   </td>
                  </tr>
                  <tr>
                   <td align="center" valign="top">
                     <!-- Footer -->
                     <table id="template_footer" border="0" cellpadding="10" cellspacing="0" width="600">
                      <tbody>
                       <tr>
                        <td style="padding: 0; -webkit-border-radius: 6px;" valign="top">
                         <table border="0" cellpadding="10" cellspacing="0" width="100%">
                           <tbody>
                             <tr>
                              <td colspan="2" id="credit" style="padding: 20px 10px 20px 10px; -webkit-border-radius: 0px; border: 0; color: #fff; font-family: Arial; font-size: 12px; line-height: 125%; text-align: center; background:#000" valign="middle">
                                   <p>This email was sent from <a style="color:#FCCB06" href="${process.env.MAIN_URL}">BoloGrahak</a></p>
                              </td>
                             </tr>
                           </tbody>
                         </table>
                        </td>
                       </tr>
                      </tbody>
                     </table>
                   <!-- End Footer -->
                   </td>
                  </tr>
                </tbody>
               </table>
             </td>
            </tr>
           </tbody>
          </table>
         </div>`
        }
          await mdlconfig.transporter.sendMail(claimed_user_mail, function (err, info) {
            if (err) {
                console.log(err);
                return res.send({
                    status: 'not ok',
                    message: 'Something went wrong'
                });
            } else {
                console.log('Mail Send: ', info.response);
                // return res.send({
                //     status: 'ok',
                //     message: 'Review Approve'
                // });
            }
          })
      }
    
  }
 
    return true;
}

//Function to send mail to client after reject
async function reviewRejectdEmail(req) {
  const sql = `
    SELECT r.created_at,r.rejecting_reason, c.company_name, u.first_name, u.email 
    FROM reviews r
    LEFT JOIN company c ON r.company_id = c.ID 
    LEFT JOIN users u ON r.customer_id = u.user_id 
    WHERE r.review_status = "0" AND r.id = "${req.review_id}"
`;

  const rejectReviewData = await query(sql);

  console.log(rejectReviewData[0])
  if(rejectReviewData.length > 0){

    const dateString = rejectReviewData[0].created_at; 
    const date = new Date(dateString); 
    const reviewDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' ,hour:'numeric',minute:'numeric',second: 'numeric' })
  
    //console.log('approve Function', reviewData)
    var mailOptions = {
      from: process.env.MAIL_USER,
      //to: 'sandip@scwebtech.com',
      to: rejectReviewData[0].email,
      subject: 'Review Rejected Email',
      html: `<div id="wrapper" dir="ltr" style="background-color: #f5f5f5; margin: 0; padding: 70px 0 70px 0; -webkit-text-size-adjust: none !important; width: 100%;">
      <table height="100%" border="0" cellpadding="0" cellspacing="0" width="100%">
       <tbody>
        <tr>
         <td align="center" valign="top">
           <div id="template_header_image"><p style="margin-top: 0;"></p></div>
           <table id="template_container" style="box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important; background-color: #fdfdfd; border: 1px solid #dcdcdc; border-radius: 3px !important;" border="0" cellpadding="0" cellspacing="0" width="600">
            <tbody>
              <tr>
               <td align="center" valign="top">
                 <!-- Header -->
                 <table id="template_header" style="background-color: #000; border-radius: 3px 3px 0 0 !important; color: #ffffff; border-bottom: 0; font-weight: bold; line-height: 100%; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif;" border="0" cellpadding="0" cellspacing="0" width="600">
                   <tbody>
                     <tr>
                     <td><img alt="Logo" src="${process.env.MAIN_URL}assets/media/logos/email-template-logo.png"  style="padding: 30px 40px; display: block;  width: 70px;" /></td>

              <td id="header_wrapper" style="padding: 36px 48px; display: block;">
                         <h1 style="color: red; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 30px; font-weight: bold; line-height: 150%; margin: 0; text-align: left;">Review Rejected</h1>
                      </td>
                     </tr>
                   </tbody>
                 </table>
           <!-- End Header -->
           </td>
              </tr>
              <tr>
               <td align="center" valign="top">
                 <!-- Body -->
                 <table id="template_body" border="0" cellpadding="0" cellspacing="0" width="600">
                   <tbody>
                     <tr>
                      <td id="body_content" style="background-color: #fdfdfd;" valign="top">
                        <!-- Content -->
                        <table border="0" cellpadding="20" cellspacing="0" width="100%">
                         <tbody>
                          <tr>
                           <td style="padding: 48px;" valign="top">
                             <div id="body_content_inner" style="color: #737373; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 14px; line-height: 150%; text-align: left;">
                              
                              <table border="0" cellpadding="4" cellspacing="0" width="90%">
                                <tr>
                                  <td colspan="2">
                                  <strong>Hello ${rejectReviewData[0].first_name},</strong>
                                  <p style="font-size:15px; line-height:20px">Your review for <i><b>"${rejectReviewData[0].company_name} on ${reviewDate}"</b></i> was unfortunately rejected because of the following reason:</p>
                                   <p style="font-size:15px; line-height:25px;">${rejectReviewData[0].rejecting_reason}</p>
                                   <p style="font-size:15px; line-height:25px;">You can submit a new review keeping the above comments in mind.</p>
                                   <small>For further details contact us at : <a href="mailto:support@bolograhak.com"><i>support@bolograhak.com</i></a></small>
                                  </td>
                                </tr>
                              </table>
                              
                             </div>
                           </td>
                          </tr>
                         </tbody>
                        </table>
                      <!-- End Content -->
                      </td>
                     </tr>
                   </tbody>
                 </table>
               <!-- End Body -->
               </td>
              </tr>
              <tr>
               <td align="center" valign="top">
                 <!-- Footer -->
                 <table id="template_footer" border="0" cellpadding="10" cellspacing="0" width="600">
                  <tbody>
                   <tr>
                    <td style="padding: 0; -webkit-border-radius: 6px;" valign="top">
                     <table border="0" cellpadding="10" cellspacing="0" width="100%">
                       <tbody>
                         <tr>
                          <td colspan="2" id="credit" style="padding: 20px 10px 20px 10px; -webkit-border-radius: 0px; border: 0; color: #fff; font-family: Arial; font-size: 12px; line-height: 125%; text-align: center; background:#000" valign="middle">
                               <p>This email was sent from <a style="color:#FCCB06" href="${process.env.MAIN_URL}">BoloGrahak</a></p>
                          </td>
                         </tr>
                       </tbody>
                     </table>
                    </td>
                   </tr>
                  </tbody>
                 </table>
               <!-- End Footer -->
               </td>
              </tr>
            </tbody>
           </table>
         </td>
        </tr>
       </tbody>
      </table>
     </div> `
    }

      mdlconfig.transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.log(err);
            return res.send({
                status: 'not ok',
                message: 'Something went wrong'
            });
        } else {
            console.log('Mail Send: ', info.response);
            return res.send({
                status: 'ok',
                message: 'Review Rejected'
            });
        }
      })
  }
 
    return true;
}

//Function to fetch Premium company details Values from the  premium_company_data table
async function getPremiumCompanyData(companyId) {
  const sql = `SELECT * FROM premium_company_data where company_id = '${companyId}' `;
  const PremiumCompanyData = await query(sql);

  //console.log('PremiumCompanyData',PremiumCompanyData[0])
  return PremiumCompanyData[0];
}

//Function to fetch User Name from the  users table
async function getUserName(email){
  const sql = `SELECT user_id, first_name  FROM users WHERE email = '${email}' `;
  const get_user_name = await query(sql);
    if(get_user_name.length > 0 ){
      return get_latest_review_results;
    }else{
      return [];
    }
 }

 //Function to fetch User email from the  users, review_reply table
async function ReviewReplyTo(Id){
  const sql = `SELECT users.email, users.first_name, c.company_name, c.ID as company_id, r.customer_id
              FROM users 
              LEFT JOIN review_reply rr ON rr.reply_to = users.user_id 
              LEFT JOIN reviews r ON r.id = rr.review_id 
              LEFT JOIN company c ON r.company_id = c.ID 
              WHERE rr.ID = '${Id}'  `;

  const get_user_email = await query(sql);
    if(get_user_email.length > 0 ){
      return get_user_email;
    }else{
      return [];
    }
 }

//Function to Send Reply To Company 
function ReviewReplyToCompany(mailReplyData){
  var mailOptions = {
    from: process.env.MAIL_USER,
    //to: 'pranab@scwebtech.com',
    to: mailReplyData[0].email,
    subject: 'Message Reply',
    html: `<div id="wrapper" dir="ltr" style="background-color: #f5f5f5; margin: 0; padding: 70px 0 70px 0; -webkit-text-size-adjust: none !important; width: 100%;">
    <table height="100%" border="0" cellpadding="0" cellspacing="0" width="100%">
     <tbody>
      <tr>
       <td align="center" valign="top">
         <div id="template_header_image"><p style="margin-top: 0;"></p></div>
         <table id="template_container" style="box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important; background-color: #fdfdfd; border: 1px solid #dcdcdc; border-radius: 3px !important;" border="0" cellpadding="0" cellspacing="0" width="600">
          <tbody>
            <tr>
             <td align="center" valign="top">
               <!-- Header -->
               <table id="template_header" style="background-color: #000; border-radius: 3px 3px 0 0 !important; color: #ffffff; border-bottom: 0; font-weight: bold; line-height: 100%; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif;" border="0" cellpadding="0" cellspacing="0" width="600">
                 <tbody>
                   <tr>
                   <td><img alt="Logo" src="${process.env.MAIN_URL}assets/media/logos/email-template-logo.png"  style="padding: 30px 40px; display: block;  width: 70px;" /></td>
                    <td id="header_wrapper" style="padding: 36px 48px; display: block;">
                       <h1 style="color: #FCCB06; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 30px; font-weight: bold; line-height: 150%; margin: 0; text-align: left;">Message Reply</h1>
                    </td>

                   </tr>
                 </tbody>
               </table>
         <!-- End Header -->
         </td>
            </tr>
            <tr>
             <td align="center" valign="top">
               <!-- Body -->
               <table id="template_body" border="0" cellpadding="0" cellspacing="0" width="600">
                 <tbody>
                   <tr>
                    <td id="body_content" style="background-color: #fdfdfd;" valign="top">
                      <!-- Content -->
                      <table border="0" cellpadding="20" cellspacing="0" width="100%">
                       <tbody>
                        <tr>
                         <td style="padding: 48px;" valign="top">
                           <div id="body_content_inner" style="color: #737373; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 14px; line-height: 150%; text-align: left;">
                            
                            <table border="0" cellpadding="4" cellspacing="0" width="90%">
                              <tr>
                                <td colspan="2">
                                <strong>Hello ${mailReplyData[0].first_name},</strong>
                                <p style="font-size:15px; line-height:20px">You got a reply from the customer for your message. 
                                <a  href="${process.env.MAIN_URL}company-review-listing/${mailReplyData[0].company_id}">Click here</a> to view.</p>
                                </td>
                              </tr>
                            </table>
                            
                           </div>
                         </td>
                        </tr>
                       </tbody>
                      </table>
                    <!-- End Content -->
                    </td>
                   </tr>
                 </tbody>
               </table>
             <!-- End Body -->
             </td>
            </tr>
            <tr>
             <td align="center" valign="top">
               <!-- Footer -->
               <table id="template_footer" border="0" cellpadding="10" cellspacing="0" width="600">
                <tbody>
                 <tr>
                  <td style="padding: 0; -webkit-border-radius: 6px;" valign="top">
                   <table border="0" cellpadding="10" cellspacing="0" width="100%">
                     <tbody>
                       <tr>
                        <td colspan="2" id="credit" style="padding: 20px 10px 20px 10px; -webkit-border-radius: 0px; border: 0; color: #fff; font-family: Arial; font-size: 12px; line-height: 125%; text-align: center; background:#000" valign="middle">
                             <p>This email was sent from <a style="color:#FCCB06" href="${process.env.MAIN_URL}">BoloGrahak</a></p>
                        </td>
                       </tr>
                     </tbody>
                   </table>
                  </td>
                 </tr>
                </tbody>
               </table>
             <!-- End Footer -->
             </td>
            </tr>
          </tbody>
         </table>
       </td>
      </tr>
     </tbody>
    </table>
   </div>`
  }
 mdlconfig.transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
          console.log(err);
          return res.send({
              status: 'not ok',
              message: 'Something went wrong'
          });
      } else {
          console.log('Mail Send: ', info.response);
          
      }
  })
 }
 //Function to Send Reply To Customer 
function ReviewReplyToCustomer(mailReplyData){
  var mailOptions = {
    from: process.env.MAIL_USER,
    //to: 'pranab@scwebtech.com',
    to: mailReplyData[0].email,
    subject: 'Message Reply',
    html: `<div id="wrapper" dir="ltr" style="background-color: #f5f5f5; margin: 0; padding: 70px 0 70px 0; -webkit-text-size-adjust: none !important; width: 100%;">
    <table height="100%" border="0" cellpadding="0" cellspacing="0" width="100%">
     <tbody>
      <tr>
       <td align="center" valign="top">
         <div id="template_header_image"><p style="margin-top: 0;"></p></div>
         <table id="template_container" style="box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important; background-color: #fdfdfd; border: 1px solid #dcdcdc; border-radius: 3px !important;" border="0" cellpadding="0" cellspacing="0" width="600">
          <tbody>
            <tr>
             <td align="center" valign="top">
               <!-- Header -->
               <table id="template_header" style="background-color: #000; border-radius: 3px 3px 0 0 !important; color: #ffffff; border-bottom: 0; font-weight: bold; line-height: 100%; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif;" border="0" cellpadding="0" cellspacing="0" width="600">
                 <tbody>
                   <tr>
                   <td><img alt="Logo" src="${process.env.MAIN_URL}assets/media/logos/email-template-logo.png"  style="padding: 30px 40px; display: block;  width: 70px;" /></td>
                    <td id="header_wrapper" style="padding: 36px 48px; display: block;">
                       <h1 style="color: #FCCB06; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 30px; font-weight: bold; line-height: 150%; margin: 0; text-align: left;">Message Reply</h1>
                    </td>

                   </tr>
                 </tbody>
               </table>
         <!-- End Header -->
         </td>
            </tr>
            <tr>
             <td align="center" valign="top">
               <!-- Body -->
               <table id="template_body" border="0" cellpadding="0" cellspacing="0" width="600">
                 <tbody>
                   <tr>
                    <td id="body_content" style="background-color: #fdfdfd;" valign="top">
                      <!-- Content -->
                      <table border="0" cellpadding="20" cellspacing="0" width="100%">
                       <tbody>
                        <tr>
                         <td style="padding: 48px;" valign="top">
                           <div id="body_content_inner" style="color: #737373; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 14px; line-height: 150%; text-align: left;">
                            
                            <table border="0" cellpadding="4" cellspacing="0" width="90%">
                              <tr>
                                <td colspan="2">
                                <strong>Hello ${mailReplyData[0].first_name},</strong>
                                <p style="font-size:15px; line-height:20px"><b>${mailReplyData[0].company_name}</b> has responded to your reviews, please visit <a  href="${process.env.MAIN_URL}company/${mailReplyData[0].company_id}">the link</a> to view response.
                                </td>
                              </tr>
                            </table>
                            
                           </div>
                         </td>
                        </tr>
                       </tbody>
                      </table>
                    <!-- End Content -->
                    </td>
                   </tr>
                 </tbody>
               </table>
             <!-- End Body -->
             </td>
            </tr>
            <tr>
             <td align="center" valign="top">
               <!-- Footer -->
               <table id="template_footer" border="0" cellpadding="10" cellspacing="0" width="600">
                <tbody>
                 <tr>
                  <td style="padding: 0; -webkit-border-radius: 6px;" valign="top">
                   <table border="0" cellpadding="10" cellspacing="0" width="100%">
                     <tbody>
                       <tr>
                        <td colspan="2" id="credit" style="padding: 20px 10px 20px 10px; -webkit-border-radius: 0px; border: 0; color: #fff; font-family: Arial; font-size: 12px; line-height: 125%; text-align: center; background:#000" valign="middle">
                             <p>This email was sent from <a style="color:#FCCB06" href="${process.env.MAIN_URL}">BoloGrahak</a></p>
                        </td>
                       </tr>
                     </tbody>
                   </table>
                  </td>
                 </tr>
                </tbody>
               </table>
             <!-- End Footer -->
             </td>
            </tr>
          </tbody>
         </table>
       </td>
      </tr>
     </tbody>
    </table>
   </div>`
  }
  mdlconfig.transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
          console.log(err);
          return res.send({
              status: 'not ok',
              message: 'Something went wrong'
          });
      } else {
          console.log('Mail Send: ', info.response);
          
      }
  })
 }

 //Function to fetch User total replied from the  review_reply table
async function TotalReplied(Id){
  const sql = `SELECT COUNT(ID) AS totalReplied
              FROM review_reply 
              WHERE reply_by = '${Id}'  `;

  const noOfReplied = await query(sql);
  //console.log(noOfReplied[0])
  return noOfReplied[0];
 }

  //Function to fetch User review data by Id from the  review table
async function reviewDataById(reviewId,userId){
  const sql = `SELECT r.* , c.company_name
              FROM reviews r
              JOIN company c ON r.company_id = c.ID 
              WHERE r.id = '${reviewId}' AND r.customer_id = '${userId}' `;

  const reviewData = await query(sql);
  //console.log(noOfReplied[0])
  return reviewData;
 }

//Function to Update User review data by Id from the  review table
 async function updateReview(reviewIfo){
  // console.log('Review Info', reviewIfo);
  // console.log('Company Info', comInfo);
  // reviewIfo['tags[]'].forEach((tag) => {
  //   console.log(tag);
  // });
  if (typeof reviewIfo['tags[]'] === 'string') {
    // Convert it to an array containing a single element
    reviewIfo['tags[]'] = [reviewIfo['tags[]']];
  }
  const currentDate = new Date();
  // Format the date in 'YYYY-MM-DD HH:mm:ss' format (adjust the format as needed)
  const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

  const updateQuery = 'UPDATE reviews SET review_title = ?, rating = ?, review_content = ?, user_privacy = ?, updated_at = ? WHERE id = ?';
  const updateData = [ reviewIfo.review_title, reviewIfo.rating, reviewIfo.review_content, reviewIfo.user_privacy, formattedDate, reviewIfo.review_id]
              
  try {
    const create_review_results = await query(updateQuery, updateData);
      if (Array.isArray(reviewIfo['tags[]']) && reviewIfo['tags[]'].length > 0) {
        //insert review_tag_relation

        await query(`DELETE FROM review_tag_relation WHERE review_id = '${reviewIfo.review_id}'`);

        const review_tag_relation_query = 'INSERT INTO review_tag_relation (review_id, tag_name) VALUES (?, ?)';
        try{
          for (const tag of reviewIfo['tags[]']) {
            const review_tag_relation_values = [reviewIfo.review_id, tag];
            const review_tag_relation_results = await query(review_tag_relation_query, review_tag_relation_values);
          }

        }catch(error){
          console.error('Error during user review_tag_relation_results:', error);
        }
      }
  }catch (error) {
    console.error('Error during user update_review_results:', error);
  }
}

// Function to count review like
async function countLike (reviewId){
  const sql = `SELECT COUNT(id) AS totalLike
    FROM review_voting WHERE review_id = '${reviewId}' AND voting = '1' `;

  const noOfLike =await query(sql);
  console.log('noOfLike',noOfLike)
  return noOfLike[0];
}

// Function to count review Dislike
async function countDislike (reviewId){
  const sql = `SELECT COUNT(id) AS totalDislike
    FROM review_voting WHERE review_id = '${reviewId}' AND voting = '0' `;

  const noOfDislike =await query(sql);
  console.log('noOfDislike',noOfDislike)
  return noOfDislike[0];
}

// Function to fetch all review voting
async function getAllReviewVoting (){
  const sql = `SELECT *
    FROM review_voting WHERE 1 `;

  const ReviewVoting =await query(sql);
  //console.log('ReviewVoting',ReviewVoting)
  return ReviewVoting;
}

//Function to Update User reply data by Id from the  review table
async function updateCustomerReply(req){
  //console.log(req)
  

  try {
    if(req.reply_id){
      const currentDate = new Date();
      // Format the date in 'YYYY-MM-DD HH:mm:ss' format (adjust the format as needed)
      const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');
      
      const update_reply_query ='UPDATE review_reply SET  comment = ?, status = ? , reason = ?, updated_at = ? WHERE ID = ? ';
  
      const update_reply_values = [
        req.reply_content || null,
        req.reply_status || '2',
        req.reply_rejecting_comment || null,
        formattedDate,
        req.reply_id
      ];
      const update_reply_result = await query(update_reply_query, update_reply_values);

      return true;
    }else {
      return false;
    }
  }catch (error) {
    return 'Error during user update_reply_query:'+error;
  }  
}

//Function to Update User reply data by Id from the  review table
async function getCompanyIdBySlug(slug){
  //console.log(req)
  try {
    const get_company_query = `SELECT ID FROM company WHERE slug = '${slug}' `;
    const get_company_Id = await query(get_company_query);
    
    console.log(get_company_Id[0]);
    return get_company_Id[0];
  }catch (error) {
    return 'Error during fetch companyId:'+error;
  }  
}


// Function to generate a unique slug from a string
function generateUniqueSlug(companyName, callback) {
  // Check if the generated slug already exists in the database
  db.query('SELECT company_name, slug FROM company', (err, existingSlugs) => {
    if (err) {
      callback(err);
      return;
    }

    const baseSlug = slugify(companyName, {
      replacement: '-',  // replace spaces with hyphens
      lower: true,      // convert to lowercase
      strict: true,     // strip special characters
      remove: /[*+~.()'"!:@]/g,
    });

    let slug = baseSlug;
    let slugExists = false;
    let count = 1;
    // Check if the generated slug already exists in the existing slugs
    existingSlugs.forEach((value) => {
      if (value.slug === baseSlug) {
        slugExists = true;
      }
      if (value.company_name == companyName) {
        count ++
      }
    });

    if (slugExists) {
      slug = `${baseSlug}-${count}`;
      //slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
    }

    callback(null, slug);
  });
}

// Function to fetch Sub Category
async function getSubCategories(categorySlug) {
  const sql = `SELECT category.category_name,category.category_slug, GROUP_CONCAT(c.category_name) AS subcategories, GROUP_CONCAT(c.category_slug ) AS subcategoriesSlug
                FROM category 
                LEFT JOIN category c ON category.ID = c.parent_id
                WHERE category.category_slug = '${categorySlug}'
                GROUP BY category.category_name `;

  const result = await query(sql);
  if(result.length > 0 ){
    return result;
  }else{
    return [];
  }
  
}

// Function to fetch  Category Company details
async function getCompanyDetails(categorySlug) {
  const sql = `SELECT c.ID, c.company_name, c.logo, c.status, c.trending, c.main_address, c.verified, c.paid_status, c.about_company, c.slug , AVG(r.rating) as comp_avg_rating, COUNT(r.id) as comp_total_reviews, pcd.cover_img
                FROM category  
                JOIN company_cactgory_relation ccr ON ccr.category_id = category.ID
                LEFT JOIN company c ON c.ID = ccr.company_id
                LEFT JOIN reviews r ON r.company_id = c.ID
                LEFT JOIN premium_company_data pcd ON pcd.company_id = c.ID
                WHERE category.category_slug = '${categorySlug}' AND c.status = '1'
                GROUP BY c.ID, c.company_name `;

  const result = await query(sql);
  if(result.length > 0 ){
    return result;
  }else{
    return [];
  }
  
}

// Function to fetch Category Filtered Company details
async function getFilteredCompanyDetails(categorySlug, filterValue) {
  console.log('filterValue',filterValue)
  if (filterValue == 'latest') {
    const sql = `SELECT c.ID, c.company_name, c.logo, c.status, c.trending, c.main_address, c.verified, c.paid_status, c.slug , AVG(r.  rating) as comp_avg_rating, COUNT(r.id) as comp_total_reviews, pcd.cover_img
                FROM category  
                JOIN company_cactgory_relation ccr ON ccr.category_id = category.ID
                LEFT JOIN company c ON c.ID = ccr.company_id
                LEFT JOIN reviews r ON r.company_id = c.ID
                LEFT JOIN premium_company_data pcd ON pcd.company_id = c.ID
                WHERE category.category_slug = '${categorySlug}' AND c.status = '1'
                GROUP BY c.ID, c.company_name 
                ORDER BY c.created_date DESC 
                LIMIT 20`;

                const result = await query(sql);
              if(result.length > 0 ){
                return result;
              }else{
                return [];
              }
                
  } else if(filterValue == 'trending') {
    const sql = `SELECT c.ID, c.company_name, c.logo, c.status, c.trending, c.main_address, c.verified, c.paid_status, c.slug , AVG(r.  rating) as comp_avg_rating, COUNT(r.id) as comp_total_reviews, pcd.cover_img
                FROM category  
                JOIN company_cactgory_relation ccr ON ccr.category_id = category.ID
                LEFT JOIN company c ON c.ID = ccr.company_id
                LEFT JOIN reviews r ON r.company_id = c.ID
                LEFT JOIN premium_company_data pcd ON pcd.company_id = c.ID
                WHERE category.category_slug = '${categorySlug}' AND c.status = '1' AND c.trending = '1'
                GROUP BY c.ID, c.company_name `;

                const result = await query(sql);
                if(result.length > 0 ){
                  return result;
                }else{
                  return [];
                }
  } else {
    const sql = `SELECT c.ID, c.company_name, c.logo, c.status, c.trending, c.main_address, c.verified, c.paid_status, c.slug , AVG(r.  rating) as comp_avg_rating, COUNT(r.id) as comp_total_reviews, pcd.cover_img
                FROM category  
                JOIN company_cactgory_relation ccr ON ccr.category_id = category.ID
                LEFT JOIN company c ON c.ID = ccr.company_id
                LEFT JOIN reviews r ON r.company_id = c.ID
                LEFT JOIN premium_company_data pcd ON pcd.company_id = c.ID
                WHERE category.category_slug = '${categorySlug}' AND c.status = '1' AND c.verified = '1'
                GROUP BY c.ID, c.company_name `;

                const result = await query(sql);
                if(result.length > 0 ){
                  return result;
                }else{
                  return [];
                }
  }
  

  
  
}

// Function to fetch Company poll details
async function getCompanyPollDetails(company_id) {
  const sql = `SELECT
                  pc.*,
                  pa.poll_answer,
                  pa.poll_answer_id,
                  pv.voting_answer_id,
                  voting_user_id
                FROM
                  poll_company pc
                JOIN (
                  SELECT
                      p.poll_id,
                      GROUP_CONCAT(DISTINCT p.answer) AS poll_answer,
                      GROUP_CONCAT(DISTINCT p.id) AS poll_answer_id
                  FROM
                      poll_answer p
                  GROUP BY
                      p.poll_id
                ) pa ON pc.id = pa.poll_id
                LEFT JOIN (
                  SELECT
                      pv.poll_id,
                      GROUP_CONCAT(pv.answer_id) AS voting_answer_id,
                      GROUP_CONCAT(pv.user_id) AS voting_user_id
                  FROM
                      poll_voting pv
                  GROUP BY
                      pv.poll_id
                ) pv ON pc.id = pv.poll_id
                WHERE
                  pc.company_id = '${company_id}' 
                ORDER BY
                  pc.id DESC;`;
  
  // const sql = `SELECT poll_company.*, GROUP_CONCAT(pa.answer) AS poll_answer, GROUP_CONCAT(pa.id) AS poll_answer_id, GROUP_CONCAT(pv.answer_id) AS voting_answer_id
  // FROM poll_company  
  // JOIN poll_answer pa ON pa.poll_id = poll_company.id
  // LEFT JOIN poll_voting pv ON pv.poll_id = poll_company.id
  // WHERE poll_company.company_id = '${company_id}' 
  // GROUP BY poll_company.id
  // ORDER BY poll_company.id DESC `;

  const result = await query(sql);
  if(result.length > 0 ){
    return result;
  }else{
    return [];
  }
  
}

//Function to insert Invitation data into review_invite_request
async function insertInvitationDetails(req) {
  console.log('insertInvitationDetails',req)
  const {emails, email_body, user_id, company_id } = req
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');
  const sql = `INSERT INTO review_invite_request( company_id, user_id, share_date, count) VALUES (?, ?, ?, ?)`;
  const data = [company_id, user_id, formattedDate, emails.length ];
  const result = await query(sql, data);
  if (result) {
    return true;
  } else {
    return false;
  }
}

//Function to send Invitation email 
async function sendInvitationEmail(req) {
  console.log('sendInvitationEmail',req)
  const {emails, email_body, user_id, company_id, company_name ,company_slug} = req;
  if(emails.length > 0){
    await emails.forEach((email)=>{
      var mailOptions = {
        from: process.env.MAIL_USER,
        //to: 'pranab@scwebtech.com',
        to: email,
        subject: 'Invitation Email',
        html: `<div id="wrapper" dir="ltr" style="background-color: #f5f5f5; margin: 0; padding: 70px 0 70px 0; -webkit-text-size-adjust: none !important; width: 100%;">
        <table height="100%" border="0" cellpadding="0" cellspacing="0" width="100%">
         <tbody>
          <tr>
           <td align="center" valign="top">
             <div id="template_header_image"><p style="margin-top: 0;"></p></div>
             <table id="template_container" style="box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important; background-color: #fdfdfd; border: 1px solid #dcdcdc; border-radius: 3px !important;" border="0" cellpadding="0" cellspacing="0" width="600">
              <tbody>
                <tr>
                 <td align="center" valign="top">
                   <!-- Header -->
                   <table id="template_header" style="background-color: #000; border-radius: 3px 3px 0 0 !important; color: #ffffff; border-bottom: 0; font-weight: bold; line-height: 100%; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif;" border="0" cellpadding="0" cellspacing="0" width="600">
                     <tbody>
                       <tr>
                       <td><img alt="Logo" src="${process.env.MAIN_URL}assets/media/logos/email-template-logo.png"  style="padding: 30px 40px; display: block;  width: 70px;" /></td>
                        <td id="header_wrapper" style="padding: 36px 48px; display: block;">
                           <h1 style="color: #FCCB06; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 30px; font-weight: bold; line-height: 150%; margin: 0; text-align: left;">Invitation Email</h1>
                        </td>
    
                       </tr>
                     </tbody>
                   </table>
             <!-- End Header -->
             </td>
                </tr>
                <tr>
                 <td align="center" valign="top">
                   <!-- Body -->
                   <table id="template_body" border="0" cellpadding="0" cellspacing="0" width="600">
                     <tbody>
                       <tr>
                        <td id="body_content" style="background-color: #fdfdfd;" valign="top">
                          <!-- Content -->
                          <table border="0" cellpadding="20" cellspacing="0" width="100%">
                           <tbody>
                            <tr>
                             <td style="padding: 48px;" valign="top">
                               <div id="body_content_inner" style="color: #737373; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 14px; line-height: 150%; text-align: left;">
                                
                                <table border="0" cellpadding="4" cellspacing="0" width="90%">
                                  <tr>
                                    <td colspan="2">
                                    <p style="font-size:15px; line-height:20px">${email_body}</p>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colspan="2">
                                    <p style="font-size:15px; line-height:20px">Please <a href="${process.env.MAIN_URL}company/${company_slug}?type=invitation">click here</a> to submit your opinion.</p>
                                    </td>
                                  </tr>
                                </table>
                                
                               </div>
                             </td>
                            </tr>
                           </tbody>
                          </table>
                        <!-- End Content -->
                        </td>
                       </tr>
                     </tbody>
                   </table>
                 <!-- End Body -->
                 </td>
                </tr>
                <tr>
                 <td align="center" valign="top">
                   <!-- Footer -->
                   <table id="template_footer" border="0" cellpadding="10" cellspacing="0" width="600">
                    <tbody>
                     <tr>
                      <td style="padding: 0; -webkit-border-radius: 6px;" valign="top">
                       <table border="0" cellpadding="10" cellspacing="0" width="100%">
                         <tbody>
                           <tr>
                            <td colspan="2" id="credit" style="padding: 20px 10px 20px 10px; -webkit-border-radius: 0px; border: 0; color: #fff; font-family: Arial; font-size: 12px; line-height: 125%; text-align: center; background:#000" valign="middle">
                                 <p>This email was sent from <a style="color:#FCCB06" href="${process.env.MAIN_URL}">BoloGrahak</a></p>
                            </td>
                           </tr>
                         </tbody>
                       </table>
                      </td>
                     </tr>
                    </tbody>
                   </table>
                 <!-- End Footer -->
                 </td>
                </tr>
              </tbody>
             </table>
           </td>
          </tr>
         </tbody>
        </table>
       </div>`
      }
      mdlconfig.transporter.sendMail(mailOptions, function (err, info) {
          if (err) {
              console.log(err);
              return false;
          } else {
              console.log('Mail Send: ', info.response);
              
          }
      })
    })
    return true;
  }
 
}

//Function to count invitation label on current month 
 async function countInvitationLabels(typeEnum) {
  const sql = `SELECT labels, COUNT(*) AS label_count
  FROM reviews
  WHERE 
      MONTH(created_at) = MONTH(CURRENT_DATE())
      AND YEAR(created_at) = YEAR(CURRENT_DATE())
      AND labels = '${typeEnum}'
      GROUP BY labels;
  `;
  const result = await query(sql);
  if(result.length > 0 ){
    return result;
  }else{
    return [];
  }
 
}

module.exports = {
  getFaqPage,
  getFaqCategories,
  getFaqItems,
  insertBusinessFeature,
  insertBusinessUpcomingFeature,
  deleteBusinessFeature,
  deleteBusinessUpcomingFeature,
  getBusinessFeature,
  getUpcomingBusinessFeature,
  getReviewedCompanies,
  getAllCompaniesReviews,
  getAllReviewTags,
  getlatestReviews,
  getAllTrendingReviews,
  getAllReviews,
  getPageMetaValues,
  getPageInfo,
  reviewApprovedEmail,
  reviewRejectdEmail,
  getPremiumCompanyData,
  getUserName,
  ReviewReplyTo,
  TotalReplied,
  ReviewReplyToCompany,
  ReviewReplyToCustomer,
  reviewDataById,
  updateReview,
  countLike,
  countDislike,
  getAllReviewVoting,
  updateCustomerReply,
  getCompanyIdBySlug,
  generateUniqueSlug,
  getSubCategories,
  getCompanyDetails,
  getFilteredCompanyDetails,
  getCompanyPollDetails,
  insertInvitationDetails,
  sendInvitationEmail,
  countInvitationLabels
};