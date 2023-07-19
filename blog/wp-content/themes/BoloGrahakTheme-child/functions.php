<?php
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


function gsdu(){
    echo get_stylesheet_directory_uri();
}

//To disable the ability to assign posts to the "Uncategorized" category in WordPress
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
?>