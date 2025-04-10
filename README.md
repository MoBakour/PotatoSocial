TODOS:

POST /login
POST /signup

GET /comments/:postId/:skips
GET /image/:imageId
POST /getposts

DELETE /delete/:action
DELETE /deletepublished/:type/:id

PATCH /follow/:action
PATCH /setavatar
PATCH /editaccountinfo
PATCH /editprivacy
PATCH /respond

POST /reaction/:action
POST /comment
POST /post

/////////////////////////////////
/////////////////////////////////
/////////////////////////////////
/////////////////////////////////
/////////////////////////////////

auth.controller.js

-   POST /auth/login
-   POST /auth/signup

user.controller.js

-   GET /user/avatar/:id
-   DELETE /user/:action
-   PUT /user/avatar
-   PUT /user/privacy
-   PUT /user/account

post.controller.js

-   GET /post/image
-   POST /post/get
-   POST /post/post
-   DELETE /post

activity.controller.js

POST /activity/reaction/:action
PUT /activity/follow/:action
PUT /activity/respond

comment.controller.js
POST /comment
GET /comment/:postId/:skips
DELETE /comment
