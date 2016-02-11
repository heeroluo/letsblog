/*!
 * LetsBlog
 * Article list page - v1.1 (2016-02-11T11:23:02+0800)
 * Released under MIT license
 */
define("/page/article/list/1.x/list",["dom/1.1.x/","ajax/1.2.x/","/common/header/1.0.x/","/common/qrcode/1.0.x/","/common/share/1.0.x/"],function(t,e,i){"use strict";var r=t("dom/1.1.x/"),a=(t("/common/header/1.0.x/"),t("/common/share/1.0.x/"));r("#article-list .article-list__item").forEach(function(t){var e=r(".article-list__item__header__title a",t);r(".share-ico",t).click(function(t){t.preventDefault(),a.to(this.getAttribute("data-sharetype"),{title:e.text(),url:e.prop("href")})})})});