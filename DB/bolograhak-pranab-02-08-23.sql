-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 02, 2023 at 08:00 AM
-- Server version: 10.4.24-MariaDB
-- PHP Version: 8.1.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bolograhak`
--

-- --------------------------------------------------------

--
-- Table structure for table `featured_companies`
--

CREATE TABLE `featured_companies` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `short_desc` text DEFAULT NULL,
  `link` text DEFAULT NULL,
  `status` text DEFAULT NULL,
  `ordering` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `featured_companies`
--

INSERT INTO `featured_companies` (`id`, `company_id`, `short_desc`, `link`, `status`, `ordering`) VALUES
(2, 1, 'sdsd', 'http://www.scwebtech.com', 'active', 1),
(3, 2, 'Parse incoming request bodies in a middleware before your handlers.', 'http://www.nestle.com', 'active', 2),
(4, 4, 'Parse incoming request bodies in a middleware before', 'http://www.royalenfield.com', 'inactive', 3);

-- --------------------------------------------------------

--
-- Table structure for table `page_info`
--

CREATE TABLE `page_info` (
  `id` int(11) NOT NULL,
  `title` text DEFAULT NULL,
  `meta_title` text DEFAULT NULL,
  `meta_desc` longtext DEFAULT NULL,
  `meta_keyword` text DEFAULT NULL,
  `status` text DEFAULT NULL,
  `secret_Key` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `page_info`
--

INSERT INTO `page_info` (`id`, `title`, `meta_title`, `meta_desc`, `meta_keyword`, `status`, `secret_Key`) VALUES
(1, 'Home', 'Meta title', 'Meta Desc', 'Meta Keyword', NULL, 'home'),
(2, 'About Us', 'Meta title', 'Meta Desc', '', NULL, 'about');

-- --------------------------------------------------------

--
-- Table structure for table `page_meta`
--

CREATE TABLE `page_meta` (
  `id` bigint(20) NOT NULL,
  `page_id` bigint(20) DEFAULT NULL,
  `page_meta_key` text DEFAULT NULL,
  `page_meta_value` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `page_meta`
--

INSERT INTO `page_meta` (`id`, `page_id`, `page_meta_key`, `page_meta_value`) VALUES
(1, 1, 'bannner_content', '<h1>World\'s Premier</h1>\r\n          <h2>Customer Experience Platform</h2>'),
(2, 1, 'for_business', '<h2 class=\"main-head\"><small>Why join Bolo Grahak</small> <br>For Business/Organisaton</h2>\r\n            <div class=\"common-ul\">\r\n              <ul class=\"mb-0\">\r\n                <li>Turn into a Hub of Customer Experience and Engagement</li>\r\n                <li>Showcase your featured products and whats trending</li>\r\n                <li>Conduct Surveys, Polls to ascertain Customer pulse </li>\r\n                <li>Establish deep continuous connect & retain your customers</li>\r\n                <li>Take advantage of latest in AI - Emotion, Voice, Video, Text AI</li>\r\n              </ul>\r\n            </div>'),
(3, 1, 'for_customer', '<h2 class=\"main-head\"><small>Why join Bolo Grahak</small> <br>For Grahak(Customer)</h2>\r\n            <div class=\"common-ul\">\r\n              <ul class=\"mb-0\">\r\n                <li>Speak freely on your Customer experience, <strong class=\"zoom_animation\">#NeverStaySilent</strong>\r\n                </li>\r\n                <li>Know about your rights as <strong class=\"zoom_animation\">#CustomerRightsMatter</strong></li>\r\n                <li>All ages, communities, nations come together, <strong\r\n                    class=\"zoom_animation\">#BuildGlobalTrust</strong></li>\r\n                <li>Make Organizations listen and innovate. <strong class=\"zoom_animation\">#CustomersHavePower</strong>\r\n                </li>\r\n                <li>Next-Gen AI technology powered. <strong class=\"zoom_animation\">#UltimateCustomerExperience</strong>\r\n                </li>\r\n              </ul>\r\n            </div>'),
(4, 1, 'cus_right_content', '<h2 class=\"main-head\"><small>Know more About</small> <br> Grahak <span>Rights</span></h2>\r\n            <p>Nunc vel risus commodo viverra maecenas accumsan. Nam aliquam sem et tortor consequat id porta. Mus\r\n              mauris vitae ultricies leo integer malesuada nunc vel arcu dui vivamus arcu felis.</p>\r\n            <div class=\"ul-50 common-ul\">\r\n              <ul>\r\n                <li>Nunc vel risus commodo</li>\r\n                <li>Nam aliquam sem et</li>\r\n                <li>Mus mauris vitae</li>\r\n                <li>Nunc vel risus commodo</li>\r\n                <li>Nam aliquam sem et</li>\r\n                <li>Mus mauris vitae</li>\r\n              </ul>\r\n            </div>'),
(5, 1, 'cus_right_button_link', '#'),
(6, 1, 'cus_right_button_text', 'View More'),
(7, 1, 'youtube_1', '<iframe width=\"100%\" height=\"315\" src=\"https://www.youtube.com/embed/xcJtL7QggTI?mute=1&autoplay=1\"\r\n                  frameborder=\"0\" allow=\"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture\"\r\n                  allowfullscreen></iframe>'),
(8, 1, 'youtube_2', '<iframe width=\"100%\" height=\"387\" src=\"https://www.youtube.com/embed/xcJtL7QggTI\"\r\n                  title=\"YouTube video player\" frameborder=\"0\"\r\n                  allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\"\r\n                  allowfullscreen></iframe>'),
(9, 1, 'youtube_3', '<iframe width=\"100%\" height=\"387\" src=\"https://www.youtube.com/embed/xcJtL7QggTI\"\r\n                  title=\"YouTube video player\" frameborder=\"0\"\r\n                  allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\"\r\n                  allowfullscreen></iframe>'),
(10, 1, 'youtube_4', '<iframe width=\"100%\" height=\"387\" src=\"https://www.youtube.com/embed/xcJtL7QggTI\"\r\n                  title=\"YouTube video player\" frameborder=\"0\"\r\n                  allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\"\r\n                  allowfullscreen></iframe>'),
(11, 1, 'fb_widget', '<img src=\"/front-end/images/fb-widget.jpg\" alt=\"img\" width=\"262\" height=\"456\">'),
(12, 1, 'twitter_widget', '<img src=\"/front-end/images/twitter-widget.jpg\" alt=\"img\" width=\"262\" height=\"456\">'),
(13, 1, 'org_responsibility_content', '<h2 class=\"main-head\"><small>Know more About</small> <br>Organization <span>Responsibility</span></h2>\r\n            <p>Nunc vel risus commodo viverra maecenas accumsan. Nam aliquam sem et tortor consequat id porta. Mus\r\n              mauris vitae ultricies leo integer malesuada nunc vel arcu dui vivamus arcu felis.</p>\r\n            <div class=\"ul-50 common-ul\">\r\n              <ul>\r\n                <li>Nunc vel risus commodo</li>\r\n                <li>Nam aliquam sem et</li>\r\n                <li>Mus mauris vitae</li>\r\n                <li>Nunc vel risus commodo</li>\r\n                <li>Nam aliquam sem et</li>\r\n                <li>Mus mauris vitae</li>\r\n              </ul>\r\n            </div>'),
(14, 1, 'org_responsibility_buttton_link', '#'),
(15, 1, 'org_responsibility_buttton_text', 'View More'),
(16, 1, 'about_us_content', '<h2 class=\"main-head\"><span>About</span> Us</h2>\r\n            <p><strong>When businesses pay attention to customer feedback and take action to address their concerns, it\r\n                leads to increased customer satisfaction and loyalty.</strong> </p>\r\n            <p><strong>So spend way less on advertisements and still increase sales and customer loyalty.</strong></p>'),
(17, 1, 'about_us_button_link', '#'),
(18, 1, 'about_us_button_text', 'Read More'),
(19, 1, 'banner_img_2', '1690376993196-banner-img2.jpg'),
(20, 1, 'cus_right_img_2', '1690378675563-slider-small-10.png'),
(21, 1, 'org_responsibility_img_4', '1690379067490-slider-small-12.png'),
(22, 1, 'about_us_img', '1690379324643-about-img3.png'),
(23, 1, 'cus_right_img_4', '1690378675577-slider-small-12.png'),
(24, 1, 'org_responsibility_img_8', '1690379069842-slider-small-8.png'),
(25, 1, 'cus_right_img_5', '1690378675580-slider-small-13.png'),
(26, 1, 'org_responsibility_img_3', '1690379067488-slider-small-11.png'),
(27, 1, 'banner_img_1', '1690376993188-banner-img-1.jpg'),
(28, 1, 'banner_img_3', '1690376993211-banner-img3.jpg'),
(29, 1, 'cus_right_img_1', '1690378675558-slider-small-9.png'),
(30, 1, 'cus_right_img_3', '1690378675571-slider-small-11.png'),
(31, 1, 'cus_right_img_6', '1690378675588-slider-small-14.png'),
(32, 1, 'cus_right_img_7', '1690378675590-slider-small-15.png'),
(33, 1, 'cus_right_img_8', '1690378675595-slider-small-8.png'),
(34, 1, 'org_responsibility_img_1', '1690379067475-slider-small-9.png'),
(35, 1, 'org_responsibility_img_2', '1690379067480-slider-small-10.png'),
(36, 1, 'org_responsibility_img_5', '1690379067492-slider-small-13.png'),
(37, 1, 'org_responsibility_img_6', '1690379069824-slider-small-14.png'),
(38, 1, 'org_responsibility_img_7', '1690379069838-slider-small-15.png'),
(39, 2, 'banner_content', '<h2 class=\"inner-main-head mb-3\"><small style=\"font-weight: 600;\">(Grahak In Sanskrit Means\r\n                           Customer)</small></h2>\r\n                     <p>was founded with a vision to create <strong>One Global Trust Platform</strong> between all\r\n                        Customers and all Organizations and inspire <strong>confidence and collaboration</strong> in the\r\n                        whole ecosystem. While being on the most <strong>sophisticated Digital and AI-driven\r\n                           platform</strong>, Bolo Grahak prides itself in being driven by <strong>seasoned and\r\n                           passionate Human beings</strong> out to transform and revolutionize the entire Customer\r\n                        Experience space.</p>\r\n                     <p>Bolo grahak is a platform for all customers, consumers, citizens, visitors of all age to share\r\n                        their shopping, visit and every other service experiences and speak/give feedback on all\r\n                        products and services. Bolo grahak would strive to help businesses, institutes, organizations,\r\n                        local bodies, governments, nations listen, act and continuously improve their offerings to\r\n                        better meet the needs of their customers.</p>'),
(40, 2, 'mission_title', 'Our Mission'),
(41, 2, 'mission_content', '<p class=\"m-0\">To enable every Customer and Organization in the world to come together, speak up\r\n                        and create better experiences.</p>'),
(42, 2, 'platform_content', '<h2 class=\"main-head\"><small>Our <strong>Easy-to-Use</strong> Platform provides </small> <br>\r\n                        <span>A fluid, transparent and integrated environment</span>\r\n                     </h2>\r\n                     <p>To enable people of <strong>all ages, all communities and all nations</strong> can easily share\r\n                        their opinions and <strong>build national and global trust</strong>.\r\n                     <p>\r\n                     <p> Bolo Grahak would help create more awareness on the <strong>Rights of the Customer</strong> and\r\n                        <strong>Responsibilities of the Organization</strong> in collaboration with local government.\r\n                        Empowered with knowledge of their rights and facilities provided by local governments, Customers\r\n                        will be able to resolve their grievances using local redressal mechanism. Customers can use the\r\n                        handle <strong>#CustomerRightsMatterBG</strong> to highlight their experiences in other Social\r\n                        Media platforms apart from using this website / mobile app / voice-video app.\r\n                     </p>'),
(43, 2, 'bolograhak_would_content', '<p><strong>Bolo Grahak would</strong> <br> endeavour to educate <strong>children</strong> and\r\n                        <strong>teenagers</strong> on Customer Rights as well as launch special campaigns for the\r\n                        <strong>senior citizens</strong>.\r\n                     </p>'),
(44, 2, 'customers_content', '<p><strong>Customers around the world will speak up </strong> <br>for their Rights coz <span\r\n                           style=\"color: #f1ae00;\" class=\"zoom_animation\">#CustomerRightsMatter</span></p>'),
(45, 2, 'service_providers_content', '<p><strong>Businesses/Service Providers will seamlessly provide</strong> <br> a holistic <span\r\n                           class=\"zoom_animation\" style=\"color: #f1ae00;\">Next-Gen Customer Experience</span></p>'),
(46, 2, 'banner_img_1', '1690446098783-slider-small-8.png'),
(47, 2, 'banner_img_2', '1690447350189-slider-small-9.png'),
(48, 2, 'banner_img_3', '1690447350230-slider-small-10.png'),
(49, 2, 'banner_img_4', '1690447350260-slider-small-11.png'),
(50, 2, 'banner_img_5', '1690447350265-slider-small-12.png'),
(51, 2, 'banner_img_6', '1690447350276-slider-small-13.png'),
(52, 2, 'banner_img_7', '1690447350298-slider-small-14.png'),
(53, 2, 'banner_img_8', '1690447350302-slider-small-15.png'),
(54, 2, 'platform_img_1', '1690447350307-slider-small-1.png'),
(55, 2, 'platform_img_2', '1690447350313-slider-small-2.png'),
(56, 2, 'platform_img_3', '1690447350315-slider-small-3.png'),
(57, 2, 'platform_img_4', '1690447350318-slider-small-4.png'),
(58, 2, 'platform_img_5', '1690447350324-slider-small-5.png'),
(59, 2, 'platform_img_6', '1690447350345-slider-small-6.png'),
(60, 2, 'platform_img_7', '1690447350351-slider-small-7.png'),
(61, 2, 'platform_img_8', '1690447350354-slider-small-9.png'),
(62, 2, 'right_img_1', '1690447350361-about-bottom-img1.jpg'),
(63, 2, 'right_img_2', '1690447350366-about-bottom-img2.jpg');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `featured_companies`
--
ALTER TABLE `featured_companies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `page_info`
--
ALTER TABLE `page_info`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `page_meta`
--
ALTER TABLE `page_meta`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `featured_companies`
--
ALTER TABLE `featured_companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `page_info`
--
ALTER TABLE `page_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `page_meta`
--
ALTER TABLE `page_meta`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
