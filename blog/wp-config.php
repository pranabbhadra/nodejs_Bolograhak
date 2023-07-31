<?php

/**

 * The base configuration for WordPress

 *

 * The wp-config.php creation script uses this file during the installation.

 * You don't have to use the web site, you can copy this file to "wp-config.php"

 * and fill in the values.

 *

 * This file contains the following configurations:

 *

 * * Database settings

 * * Secret keys

 * * Database table prefix

 * * ABSPATH

 *

 * @link https://wordpress.org/support/article/editing-wp-config-php/

 *

 * @package WordPress

 */



// ** Database settings - You can get this info from your web host ** //

/** The name of the database for WordPress */

define( 'DB_NAME', 'bolograhak' );



/** Database username */

define( 'DB_USER', 'admin' );



/** Database password */

define( 'DB_PASSWORD', 'bGdbPa55w0rD' );



/** Database hostname */

define( 'DB_HOST', 'bolograhakdb.cb41jdmx4rqo.us-east-1.rds.amazonaws.com' );



/** Database charset to use in creating database tables. */

define( 'DB_CHARSET', 'utf8mb4' );



/** The database collate type. Don't change this if in doubt. */

define( 'DB_COLLATE', '' );



/**#@+

 * Authentication unique keys and salts.

 *

 * Change these to different unique phrases! You can generate these using

 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.

 *

 * You can change these at any point in time to invalidate all existing cookies.

 * This will force all users to have to log in again.

 *

 * @since 2.6.0

 */

define( 'AUTH_KEY',         '5r2#c30FOiGeWbECR)2.qZuH)iolO/rLHvd=GU078kn/P/L6HWQnW>1nbI/[c.xN' );

define( 'SECURE_AUTH_KEY',  '(%aF}^fZr%*31Bd`n.HE5q4[V9250/S[#6AiCvvuT~:l^hAe9Xx*LZ$*8C@pZP0X' );

define( 'LOGGED_IN_KEY',    '.Tk,X$~x*[;*D#^loey2%R1#P<vn|a=v:VwMyaPJ_77 =uQ@QtR{L;U#VNR}~CR7' );

define( 'NONCE_KEY',        '&%{GvZLyw>$-{z$3YHcvw5->3RLaD({9V-x+O[m? yB=J5R/8-;!2fPUUUjE.[h!' );

define( 'AUTH_SALT',        'MIWAqM5|[KVyAMYRE@=<ftZ~A%9E#|41^/Z9z:d+Mo@Z<kp{1Ano<ag>dEO{+Vil' );

define( 'SECURE_AUTH_SALT', 'ZvB &e?}k>x?j5xPB<W1[ThH1@!9i1>!Wz80`DQWjEPJEYI]X!6oAi*vq6goX==^' );

define( 'LOGGED_IN_SALT',   ')sVDDXp)C^@M Zk!E:y2G>y#U7<0C!W,*T3x/@es>I0[9K`yBLy+y|o&}^)TBO>+' );

define( 'NONCE_SALT',       'o1[ixtGd`EN>T4NZby=`&,MPCB[2`i5i{#9B~G&t1fCvkP5iG`!^{?-H>He~Ql7!' );



/**#@-*/



/**

 * WordPress database table prefix.

 *

 * You can have multiple installations in one database if you give each

 * a unique prefix. Only numbers, letters, and underscores please!

 */

$table_prefix = 'bg_';



/**

 * For developers: WordPress debugging mode.

 *

 * Change this to true to enable the display of notices during development.

 * It is strongly recommended that plugin and theme developers use WP_DEBUG

 * in their development environments.

 *

 * For information on other constants that can be used for debugging,

 * visit the documentation.

 *

 * @link https://wordpress.org/support/article/debugging-in-wordpress/

 */

define( 'WP_DEBUG', true );



/* Add any custom values between this line and the "stop editing" line. */







/* That's all, stop editing! Happy publishing. */



/** Absolute path to the WordPress directory. */

if ( ! defined( 'ABSPATH' ) ) {

	define( 'ABSPATH', __DIR__ . '/' );

}



/** Sets up WordPress vars and included files. */

require_once ABSPATH . 'wp-settings.php';

