<?php
if(isset($_GET['login_check'])) {
    wp_set_current_user($_GET['login_check']);//Set current user
    wp_set_auth_cookie( $_GET['login_check'], true );
    $home_url = 'http://bolograhak.in/';
    wp_redirect($home_url);
    exit;
}

add_action( 'after_setup_theme', 'baw_theme_setup' );
function baw_theme_setup() {
 add_image_size( 'latest-blog-thumb', 619, 425, true );
 add_image_size( 'trending-blog-thumb', 264, 215, true );
 add_image_size( 'home-blog-thumb', 564, 387, true );
 add_image_size( 'blog-thumb', 267, 183, true );
 add_image_size( 'blog-banner', 1142, 425, true );
 add_image_size( 'blog-mobile-banner', 551, 205, true );
 add_image_size( 'blog-tab-banner', 745, 277, true );
 add_image_size( 'blog-smalld-banner', 965, 359, true );
}

//------Disable Admin bar----------------------//
function disable_admin_bar_for_all_users() {
    return false;
}
add_filter('show_admin_bar', 'disable_admin_bar_for_all_users');

//----- Disallow to access WP admin dashboard-----------//
function restrict_dashboard_access_for_subscribers() {
    // Check if the user is logged in and has the 'subscriber' role
    if (is_user_logged_in() && current_user_can('subscriber') && is_admin()) {
        // Redirect subscribers to the home URL
        wp_redirect(home_url());
        exit;
    }
}
add_action('admin_init', 'restrict_dashboard_access_for_subscribers');

// Delete Node cookie on WP Logout-------//
function delete_another_cookie_on_logout() {
    // Replace 'cookie_name_to_delete' with the name of the cookie you want to delete
    $cookie_name = 'user';
    $cookie_value = ''; // The value of the cookie is not important for deletion
    $cookie_expiration = time() - 3600; // Set the expiration time to a past date (1 hour ago)

    // Set the cookie with the past expiration time to delete it
    setcookie($cookie_name, $cookie_value, $cookie_expiration, '/');
}
add_action('wp_logout', 'delete_another_cookie_on_logout');



function gsdu(){
    echo get_stylesheet_directory_uri();
}

//To disable the ability to assign posts to the "Uncategorized" category in WordPress
/*
function disable_uncategorized_category($categories) {
    foreach ($categories as $key => $category) {
        if ($category->name == 'Uncategorized') {
            unset($categories[$key]);
            break;
        }
    }
    return $categories;
}
add_filter('get_terms', 'disable_uncategorized_category', 10, 2);
*/

// post Details page Custom Comment Form
function enqueue_custom_scripts() {
    wp_enqueue_script('jquery');
    //wp_enqueue_script('custom-script', get_template_directory_uri() . '/js/custom-script.js', array('jquery'), '1.0', true);
    wp_enqueue_script('search-scripts', get_stylesheet_directory_uri() . '/js/search-js.js', array('jquery'), '1.0', true);

    // Localize the AJAX URL
    wp_localize_script('search-scripts', 'blog_search_ajax_object', array(
        'ajax_url' => admin_url('admin-ajax.php')
    ));    
}
add_action('wp_enqueue_scripts', 'enqueue_custom_scripts');

function enable_ajax_comments() {
    wp_enqueue_script('comment-reply');
    if (is_singular() && comments_open() && get_option('thread_comments')) {
        wp_enqueue_script('ajax-comment-script', get_template_directory_uri() . '/js/ajax-comment-script.js', array('jquery'), '1.0', true);
    }
}
add_action('wp_enqueue_scripts', 'enable_ajax_comments');

function handle_ajax_comment_submission() {
    // Check for the custom action
    if (isset($_POST['action']) && $_POST['action'] === 'submit_comment') {
        // Get the comment fields
        $comment_data = array(
            'comment_content' => $_POST['comment'],
            'comment_author'  => $_POST['author'],
            'comment_author_email' => $_POST['email'],
            'comment_author_url'   => $_POST['url'],
            'comment_upload_image' => $_FILES['comment_upload_image'], // Handle the uploaded image
            'comment_designation' => $_POST['comment_designation'], // Get the designation field value
        );

        // Process and save the comment data
        $comment_id = wp_new_comment($comment_data);
        if ($comment_id) {
            echo 'success'; // Send a success response
        } else {
            echo 'error'; // Send an error response
        }
    }

    exit(); // Always exit after processing AJAX requests
}
add_action('wp_ajax_submit_comment', 'handle_ajax_comment_submission');
add_action('wp_ajax_nopriv_submit_comment', 'handle_ajax_comment_submission'); // For non-logged-in users

function remove_comment_form_novalidate( $defaults ) {
    $defaults['novalidate'] = '';
    return $defaults;
}
add_filter( 'comment_form_defaults', 'remove_comment_form_novalidate' );

// Handle the AJAX request and perform the blog search
function blog_search_action_callback() {
    $keyword = $_POST['keyword'];
    $args = array(
      'posts_per_page'   => -1,
      'post_type'        => 'post',
      's'   =>  $keyword, 
      'post_status'      => 'publish'
    );
    query_posts($args);
    $response = '<ul class="p-0 m-0">';
    if (have_posts()) : while (have_posts()) : the_post();
        $response .= '<li><a href="#" data-resulttitle="'.get_the_title().'" data-resultexcerpt="'.get_the_excerpt().'" data-resultpermalink="'.get_the_permalink().'" >'.get_the_title().'</a></li>';
    endwhile; endif; wp_reset_query();
    $response .= '</ul>';
  echo $response;
  wp_die();
}
add_action('wp_ajax_blog_search_action', 'blog_search_action_callback');
add_action('wp_ajax_nopriv_blog_search_action', 'blog_search_action_callback');


//----------Custom User Registration -----------------//
function custom_user_registration_init() {
    register_rest_route('custom/v1', '/register', array(
        'methods' => 'POST',
        'callback' => 'custom_user_registration_handler',
    ));
}
add_action('rest_api_init', 'custom_user_registration_init');

function custom_user_registration_handler($request) {
    $parameters = $request->get_params();

    // Validate user input here (e.g., check required fields, email format, etc.)

    // Example validation for required fields
    if (empty($parameters['username']) || empty($parameters['email']) || empty($parameters['password'])) {
        return new WP_Error('registration_failed', __('Username, email, and password are required.', 'text-domain'), array('status' => 400));
    }

    // Example validation for password strength (customize as needed)
    if (strlen($parameters['password']) < 6) {
        return new WP_Error('weak_password', __('Password should be at least 6 characters long.', 'text-domain'), array('status' => 400));
    }

    // Create the new user
    $user_id = wp_create_user($parameters['username'], $parameters['password'], $parameters['email']);

    if (is_wp_error($user_id)) {
        return new WP_Error('registration_failed', __('User registration failed.', 'text-domain'), array('status' => 500));
    }

    // Set custom user meta (first name and last name)
    update_user_meta($user_id, 'first_name', $parameters['first_name']);
    update_user_meta($user_id, 'last_name', $parameters['last_name']);

    // Return a success response with the user ID
    return array('user_id' => $user_id);
}

//----------Custom User Login -----------------//
// Custom User Login Endpoint
function custom_user_login_init() {
    register_rest_route('custom/v1', '/login', array(
        'methods' => 'POST',
        'callback' => 'custom_user_login_handler',
    ));
}
add_action('rest_api_init', 'custom_user_login_init');

// Custom User Login Handler
function custom_user_login_handler($request) {
    $parameters = $request->get_params();

    // Validate user input here (e.g., check required fields, email format, etc.)

    // Example validation for required fields
    if (empty($parameters['email']) || empty($parameters['password'])) {
        return new WP_Error('login_failed', __('Email and password are required.', 'text-domain'), array('status' => 400));
    }

    // Attempt to log in the user
    $creds = array(
        'user_login' => $parameters['email'],
        'user_password' => $parameters['password'],
        'remember' => true
    );
    $user = wp_signon($creds, false);

    if (is_wp_error($user)) {
        return new WP_Error('login_failed', __('Invalid email or password.', 'text-domain'), array('status' => 401));
    } else {
        // Return the user data if login is successful
        // wp_set_current_user($user->ID);//Set current user
        // wp_set_auth_cookie( $user->ID, true );
        // do_action('wp_login', $parameters['email']);
        // wp_redirect('http://localhost/bolo-grahak/blog/protected-page/');
        // exit;
        return array(
            'status' => 'ok',
            'data' => $user->ID,
            'message' => 'Login successful.'
        );
    }
}


//----------Home Latest Blog API -----------------//
function home_latest_blog_api_init() {
    register_rest_route('custom/v1', '/home-blog', array(
        'methods' => 'GET',
        'callback' => 'home_latest_blog_api_handler',
    ));
}
add_action('rest_api_init', 'home_latest_blog_api_init');

function home_latest_blog_api_handler($request) {
    $post_items = [];
    $args = array(
        'posts_per_page'  => 1,
        'post_status' => 'publish',
    );
    query_posts($args);
    if (have_posts()) : while (have_posts()) : the_post();
    $ID = get_the_ID();
    $thumbnail = wp_get_attachment_image_src( get_post_thumbnail_id( $ID ), 'home-blog-thumb' );
    $alt_text = get_post_meta(get_post_thumbnail_id( $ID ), '_wp_attachment_image_alt', true);
    $title = get_the_title();
    $the_title = strip_tags($title);
    if(strlen($the_title)>45){
      $the_title = substr($the_title,0,45).'..';
    }
      $post_items[] = array(
                        'id' =>  $ID,
                        'title'  =>  $title,
                        'publish_date'  =>  get_the_time(__('M d, Y', 'kubrick')),
                        'thumbnail'  =>  $thumbnail['0'],
                        'thumbnail_alt'  =>  $alt_text,
                        'thumbnail_alt'  =>  $alt_text,
                        'permalink' => get_the_permalink()
                      );
    endwhile; endif; wp_reset_query();
    
    
    $args = array(
        'posts_per_page'  => 2,
        'post_status' => 'publish',
        'offset'  => 1,
    );
    query_posts($args);
    if (have_posts()) : while (have_posts()) : the_post();
    $ID = get_the_ID();
    $thumbnail = wp_get_attachment_image_src( get_post_thumbnail_id( $ID ), 'trending-blog-thumb' );
    $alt_text = get_post_meta(get_post_thumbnail_id( $ID ), '_wp_attachment_image_alt', true);
    $title = get_the_title();
    $the_title = strip_tags($title);
    if(strlen($the_title)>45){
      $the_title = substr($the_title,0,45).'..';
    }
      $post_items[] = array(
                        'id' =>  $ID,
                        'title'  =>  $title,
                        'publish_date'  =>  get_the_time(__('M d, Y', 'kubrick')),
                        'thumbnail'  =>  $thumbnail['0'],
                        'thumbnail_alt'  =>  $alt_text,
                        'thumbnail_alt'  =>  $alt_text,
                        'permalink' => get_the_permalink()
                      );
    endwhile; endif; wp_reset_query();

    if(count($post_items)>0){
        $data = array(
            'status' => 'ok',
            'data' => $post_items,
            'success_message' => 'All posts for home page',
            'error_message' => ''
            );        
        return $data;
    }else{
        $data = array(
            'status' => 'err',
            'data' => '',
            'success_message' => '',
            'error_message' => 'No result found'
            );
        return $data;
    }
}
?>
