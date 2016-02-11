/*!
 * LetsBlog
 * Article detail page - v1.1 (2016-02-11T16:24:45+0800)
 * Released under MIT license
 */
define("/page/article/detail/1.x/detail",["dom/1.1.x/","/common/qrcode/1.0.x/qrcode","/common/share/1.0.x/share","tmpl/2.1.x/","ajax/1.2.x/","widget/1.1.x/","paginator/1.1.x/","validator/1.1.x/","/common/comment/1.0.x/comment"],function(t,e,n){"use strict";var o=t("dom/1.1.x/"),i=t("/common/share@1.0.x"),c=t("/common/comment@1.0.x");o(".share-btn").click(function(t){t.preventDefault(),i.to(this.getAttribute("data-sharetype"),{title:document.title,url:window.location.href})});var m=o("#comment__form");new c({listWrapper:o("#comment__list"),form:m,page:1,articleId:m.find("input[name=articleid]").val(),events:{submitsuccess:function(t){o(".comment__total").text(t.result.totalRows)}}})});