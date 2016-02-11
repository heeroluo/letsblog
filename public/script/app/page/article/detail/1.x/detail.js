/*!
 * LetsBlog
 * Article detail page - v1.1 (2016-02-11T11:23:01+0800)
 * Released under MIT license
 */
define("/page/article/detail/1.x/detail",["dom/1.1.x/","ajax/1.2.x/","/common/header/1.0.x/","/common/qrcode/1.0.x/","/common/share/1.0.x/","tmpl/2.1.x/","widget/1.1.x/","paginator/1.1.x/","validator/1.1.x/","/common/comment/1.0.x/"],function(t,e,n){"use strict";var o=t("dom/1.1.x/"),i=(t("/common/header/1.0.x/"),t("/common/share/1.0.x/")),m=t("/common/comment/1.0.x/");o(".share-btn").click(function(t){t.preventDefault(),i.to(this.getAttribute("data-sharetype"),{title:document.title,url:window.location.href})});var c=o("#comment__form");new m({listWrapper:o("#comment__list"),form:c,page:1,articleId:c.find("input[name=articleid]").val(),events:{submitsuccess:function(t){o(".comment__total").text(t.result.totalRows)}}})});