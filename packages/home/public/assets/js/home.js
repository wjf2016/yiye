/**
 * Created by laodao on 14-10-10.
 */
$(function(){
    initialize();
});

//initialization
function initialize() {


    $('.channel-item').on('click touch', function(){
        $('.channel-item').removeClass('active');
        $(this).addClass('active').children('.links-num').remove();
    });
    $('#explore').on('click', function() {
        $(this).addClass('locked');
    });
    $('#user-center, #sub-channel-list>li, #admin-channel-list>li, .create-channel>button').on('click', function() {
        $('#explore').removeClass('locked');
    });
    $('#rounded-arrow').on('click', function() {
        if($(this).hasClass('active')) {
            $(this).removeClass('active');
            $('#function-module').removeClass('unfold');
        } else {
            $(this).addClass('active');
            $('#function-module').addClass('unfold');
        }
    });

}



