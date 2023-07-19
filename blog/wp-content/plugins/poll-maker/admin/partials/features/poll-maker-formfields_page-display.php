<div class="wrap">
    <div class="ays-poll-heading-box">
        <div class="ays-poll-wordpress-user-manual-box">
            <a href="https://ays-pro.com/wordpress-poll-maker-user-manual" target="_blank" style="text-decoration: none;font-size: 13px;">
                <i class="ays_poll_fas ays_fa_file_text"></i>
                <span style="margin-left: 3px;text-decoration: underline;"><?php echo __("View Documentation", $this->plugin_name); ?></span>
            </a>
        </div>
    </div>
    <h1 class="wp-heading-inline">
        <?php
            echo esc_html(get_admin_page_title());
        ?>
    </h1>
    <div class="ays-poll-how-to-user-custom-fields-box" style="margin: auto;">
        <div class="ays-poll-how-to-user-custom-fields-title">
            <h4><?php echo __( "Learn How to Use Custom Fields in Poll Maker", $this->plugin_name ); ?></h4>
        </div>
        <div class="ays-poll-how-to-user-custom-fields-youtube-video">
            <iframe width="560" height="315" src="https://www.youtube.com/embed/LnaTowgH29c" loading="lazy" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
    </div>
    <div class="row" style="margin:0;">
        <div class="col-sm-12">
            <div class="pro_features_atributes pro_features">
                <div style="margin-right:20px;">
                    <p style="font-size:20px;">
                        <?php echo __("This feature is available only in ", $this->plugin_name); ?>
                                <a href="https://ays-pro.com/wordpress/poll-maker" target="_blank" title="Developer feature"><?php echo __("PRO version!!!", $this->plugin_name); ?></a>
                    </p>
                </div>
            </div>
            <img src="<?php echo POLL_MAKER_AYS_ADMIN_URL . '/images/features/personal_avatar.png'; ?>" alt="Statistics" style="width: 100%;">
        </div>
    </div>

</div>
