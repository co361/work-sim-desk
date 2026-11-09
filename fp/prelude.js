/* Presentation-only setup before the unchanged Day 1 engine starts. */
window.WS7_FIRST_PERSON=true;
if(!avatarPref())setAvatarPref('f');
// Keep roster/name binding and stored identity; do not request portrait images.
window.avatarPic=avatarPic=function(){return '';};
