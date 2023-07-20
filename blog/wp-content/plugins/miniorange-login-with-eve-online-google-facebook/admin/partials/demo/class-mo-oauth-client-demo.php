<?php
/**
 * Demo
 *
 * @package    demo
 * @author     miniOrange <info@miniorange.com>
 * @license    MIT/Expat
 * @link       https://miniorange.com
 */

/**
 * Handle demo requests
 */
class MO_OAuth_Client_Demo {

	/**
	 * Request for demo
	 */
	public static function requestfordemo() {
		self::demo_request();
	}

	/**
	 * Display UI to make demo request
	 */
	public static function demo_request() {
		$democss = 'width: 325px; height:35px;';
		?>
			<div class="mo_demo_layout mo_oauth_contact_heading mo_oauth_outer_div">
			<div class="mo_oauth_request_demo_header"><div class="mo_oauth_attribute_map_heading"> <?php esc_html_e( 'Request for Demo/ Trial', 'miniorange-login-with-eve-online-google-facebook' ); ?></div></div>
		<?php
			$demo_credentials = get_option( 'mo_oauth_demo_creds' );
		if ( $demo_credentials && ( strtotime( $demo_credentials['validity'] ) > strtotime( gmdate( 'd F, Y' ) ) ) ) {
				$site_url           = $demo_credentials['site_url'];
				$email              = $demo_credentials['email'];
				$temporary_password = $demo_credentials['temporary_password'];
				$password_link      = $demo_credentials['password_link'];
				$validity           = $demo_credentials['validity'];
			?>
			<div class="mo_oauth_video_demo_bottom_message">You have successfully availed the trial for the OAuth Client SSO plugin. Please find the details below.</div>
			<div class="mo_demo_table_layout" style="padding-left: 5px;width: 90%">
				<table width="50%">
			<tr>
				<td>
				<div><strong class="mo_strong">Trial URL : </strong></div>
				</td>
				<td>
					<p><a href="<?php echo esc_url( $site_url . '/admin.php?page=mo_oauth_settings' ); ?>" target="_blank"><b>[Click Here]</b></a></p>
				</td>
			</tr>
			<tr>
				<td>
				<div><strong class="mo_strong">Username : </strong></div>
				</td>
				<td>
					<p>
						<?php echo esc_html( $email ); ?>
					</p>
				</td>
			</tr>
			<tr>
				<td>
				<div><strong class="mo_strong">Password : </strong></div>
				</td>
				<td>
					<p>
						<?php echo esc_html( $temporary_password ); ?>
					</p>
				</td>
			</tr>
			<tr>
				<td>
				<div><strong class="mo_strong">Valid Till: </strong></div>
				</td>
				<td>
					<p>
						<?php echo esc_html( $validity ); ?>
					</p>
				</td>
			</tr>
			</table>
			<div class="mo_oauth_video_demo_bottom_message">You can also reset your trial password using this <a href="<?php echo esc_url( $password_link ); ?>" target="_blank"><b>[LINK]</b></a>.<br>
			<b>Tip:</b> You must have received an email as well for these credentials to access this trial. <br><br>Also, if you face any issues or still not convinced with this trial, don't hesitate to contact us at <b><a href="mailto:oauthsupport@xecurify.com?subject=WP OAuth Client Plugin On Demo - Enquiry">oauthsupport@xecurify.com</a></b>.</div>
			&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
			</div>
			</div>
			<?php
		} else {
			?>
			</br><blockquote class="mo_oauth_blackquote mo_oauth_paragraph_div" style="  margin-bottom: 0px;"><?php esc_html_e( 'Want to try out the paid features before purchasing the license? Just let us know which plan you\'re interested in and we will setup a demo for you.', 'miniorange-login-with-eve-online-google-facebook' ); ?></blockquote>
					<form method="post" action="">
					<input type="hidden" name="option" value="mo_oauth_client_demo_request_form" />
			<?php wp_nonce_field( 'mo_oauth_client_demo_request_form', 'mo_oauth_client_demo_request_field' ); ?>
					<div style="display:flex"><div>
					<table class="mo_demo_table_layout">
						<tr><td>
							<div><strong class="mo_strong">Email id <p style="display:inline;color:red;">*</p>: </strong></div>
							<div><input class="mo_oauth_request_demo_inputs" required type="email" style="<?php echo esc_attr( $democss ); ?>" name="mo_auto_create_demosite_email" placeholder="We will use this email to setup the demo for you" value="<?php echo esc_attr( get_option( 'mo_oauth_admin_email' ) ); ?>" /></div></td>
						</tr>
						<tr>
							<td>
							<div><strong class="mo_strong"><?php esc_html_e( 'Request a demo for', 'miniorange-login-with-eve-online-google-facebook' ); ?> <p style="display:inline;color:red;">*</p>: </strong></div>
							<div>
								<select class="mo_oauth_request_demo_inputs" required style="<?php echo esc_attr( $democss ); ?>" name="mo_auto_create_demosite_demo_plan" id="mo_oauth_client_demo_plan_id">
									<option disabled value="" selected>------------------ Select ------------------</option>
									<option value="miniorange-oauth-client-standard-common@11.6.1">WP <?php echo esc_html( MO_OAUTH_PLUGIN_NAME ); ?> Standard Plugin</option>
									<option value="mo-oauth-client-premium@21.5.3">WP <?php echo esc_html( MO_OAUTH_PLUGIN_NAME ); ?> Premium Plugin</option>
									<option value="miniorange-oauth-client-enterprise@31.5.7">WP <?php echo esc_html( MO_OAUTH_PLUGIN_NAME ); ?> Enterprise Plugin</option>
									<option value="miniorange-oauth-client-allinclusive@48.3.0">WP <?php echo esc_html( MO_OAUTH_PLUGIN_NAME ); ?> All Inclusive Plugin</option>
									<option value="Not Sure">Not Sure</option>
								</select>
							</div></td>
						</tr>
						<tr><td>
							<div><strong class="mo_strong"><?php esc_html_e( 'Usecase', 'miniorange-login-with-eve-online-google-facebook' ); ?><p style="display:inline;color:red;">*</p> : </strong></div>
							<div>
							<textarea class="mo_oauth_request_demo_inputs" type="text" minlength="15" name="mo_auto_create_demosite_usecase" style="resize: vertical; width:325px; height:130px;" rows="4" placeholder="<?php esc_html_e( 'Example. Login into WordPress using Cognito, SSO into WordPress with my company credentials, Restrict gmail.com accounts to my WordPress site etc.', 'miniorange-login-with-eve-online-google-facebook' ); ?>" required value=""></textarea>
							</div></td>
						</tr> 
						</table></div><div>
						<table class="mo_demo_table_layout">
						<tr id="add-on-list">
							<td colspan="2">
							<p><strong class="mo_strong"><?php esc_html_e( 'Select the Add-ons you are interested in (Optional)', 'miniorange-login-with-eve-online-google-facebook' ); ?> :</strong></p>
							<blockquote class="mo_oauth_blackquote"><i><strong class="mo_strong">(<?php esc_html_e( 'Note', 'miniorange-login-with-eve-online-google-facebook' ); ?>: </strong> <?php esc_html_e( 'All-Inclusive plan entitles all the addons in the license cost itself.', 'miniorange-login-with-eve-online-google-facebook' ); ?> )</i></blockquote>
							<table>
					<?php
					$count = 0;
					foreach ( MO_OAuth_Client_Addons::$all_addons as $key => $value ) {
						if ( 0 !== $key && 0 !== $value && true === $value['in_allinclusive'] ) {
							if ( 0 === $count ) {
								?>
											<tr>
												<td>
													<input type="checkbox" class="mo_input_checkbox mo_oauth_demo_form_checkbox" style="margin:7px 5px 7px 5px" name="<?php echo esc_attr( $value['tag'] ); ?>" value="true"> <?php echo esc_html( $value['title'] ); ?><br/>
												</td>
									<?php
									++$count;
							} elseif ( 1 === $count ) {
								?>
											<td>
												<input type="checkbox" class="mo_input_checkbox mo_oauth_demo_form_checkbox" style="margin:7px 5px 7px 5px" name="<?php echo esc_attr( $value['tag'] ); ?>" value="true"> <?php echo esc_html( $value['title'] ); ?><br/>
											</td>
											</tr>
									<?php
									$count = 0;
							}
						}
					}
					?>
								</table>
							</td>
						</tr>	
							</table></div></div><table style="padding-left:25px">
						<tr>
							<td>
								<input type="submit" name="submit" value="<?php esc_html_e( 'Submit Demo Request', 'miniorange-login-with-eve-online-google-facebook' ); ?>" class="button button-large mo_oauth_demo_request_btn" />
							</td>
						</tr>
					</table>
				<!-- </div> -->
			</form>
			</div>
			<?php
		}
		?>
			<!-- VIDEO DEMO DOWN -->
			<div class="mo_demo_layout mo_oauth_contact_heading mo_oauth_outer_div">
			<div class="mo_oauth_request_demo_header"><div class="mo_oauth_attribute_map_heading"> <?php esc_html_e( 'Request for Video Demo', 'miniorange-login-with-eve-online-google-facebook' ); ?></div></div>
					<div style="display:flex">
						<div class="mo_oauth_video_demo_container_form">
							<form method="post" action="">
								<input type="hidden" name="option" value="mo_oauth_client_video_demo_request_form" />
								<?php wp_nonce_field( 'mo_oauth_client_video_demo_request_form', 'mo_oauth_client_video_demo_request_field' ); ?>
								<table class="mo_demo_table_layout">
								<tr><td>
										<div><strong class="mo_strong">Email id <p style="display:inline;color:red;">*</p>: </strong></div>
										<div><input type="text" class="mo_oauth_video_demo_email" style="<?php echo esc_attr( $democss ); ?>" placeholder="We will use this email to setup the demo for you" name="mo_oauth_video_demo_email" ></div>
							</tr></td>
								<tr>
									<td><div><strong class="mo_strong">Date<p style="display:inline;color:red;">*</p>: </strong></div>
									<div><input type="date" class="mo_oauth_video_demo_date" style="<?php echo esc_attr( $democss ); ?>" name="mo_oauth_video_demo_request_date" placeholder="Enter the date for demo"></div>
								</td>	
								</tr>
								<tr>
									<td>
									<div><strong class="mo_strong">Local Time<p style="display:inline;color:red;">*</p>: </strong></div>
									<div><input type="time" class="mo_oauth_video_demo_time" placeholder="Enter your time" style="<?php echo esc_attr( $democss ); ?>" name="mo_oauth_video_demo_request_time">
										<input type="hidden" name="mo_oauth_video_demo_time_diff" id="mo_oauth_video_demo_time_diff"></div>
									</td>
								</tr>
								<tr>
									<td style="color:grey;">Eg:- 12:56, 18:30, etc.</td>
								</tr>
									<tr><td><div>
										<strong class="mo_strong">Usecase/ Any comments:<p style="display:inline;color:red;">*</p>: </strong></div>
										<div><textarea name="mo_oauth_video_demo_request_usecase_text" class="mo_oauth_video_demo_form_usecase" style="resize: vertical; width:325px; height:150px;" minlength="15" placeholder="Example. Login into WordPress using Cognito, SSO into WordPress with my company credentials, Restrict gmail.com accounts to my WordPress site etc."></textarea>
									</div></td></tr>
									</table>
								</div>
						<div class="mo_oauth_demo_container_gif_section mo_demo_table_layout">
							<div class="mo_oauth_video_demo_message">
								Your overview <a style="color:#012970"><strong class="mo_strong">Video Demo</strong></a> will include
							</div>
							<div class="mo_oauth_video_demo_bottom_message">
								<img class="mo_oauth_video_demo_gif" src="<?php echo esc_attr( plugin_dir_url( __FILE__ ) ) . '/img/setup-gif.jpg'; ?>" alt="mo-demo-jpg">
							</div>
							<div class="mo_oauth_video_demo_bottom_message" >
									<strong class="mo_strong">You can set up a screen share meeting with our developers to walk you through our plugin featuers.</strong>
								<div class="mo_oauth_video_demo_bottom_message">
									<img class="mo_oauth_video_demo_icon" src="<?php echo esc_attr( plugin_dir_url( __FILE__ ) ) . '/img/check.png'; ?>"  alt="">
									Overview of all Premium Plugin features.
								</div>	
								<div style="margin-top:10px">
									<img class="mo_oauth_video_demo_icon" src="<?php echo esc_attr( plugin_dir_url( __FILE__ ) ) . '/img/support.png'; ?>"  alt="">
									Get a guided demo from a Developer via screen share meeting.
								</div>
							</div>
						</div>
					</div>
					<table style="padding-left:25px;">
						<tr>
							<td>
								<input type="submit" name="submit" value="<?php esc_html_e( 'Submit Demo Request', 'miniorange-login-with-eve-online-google-facebook' ); ?>" class="button button-large mo_oauth_demo_request_btn" />
							</td>
						</tr>
					</table>	
					</form>					
				</div>	
			<script>
				var d = new Date();
				var n = d.getTimezoneOffset();
				document.getElementById("mo_oauth_video_demo_time_diff").value = n;
			</script>	
			<?php
	}
}
