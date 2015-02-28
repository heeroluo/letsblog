-- phpMyAdmin SQL Dump
-- version 4.2.11
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: 2015-02-24 03:06:14
-- 服务器版本： 5.6.19
-- PHP Version: 5.5.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `letsblog`
--

-- --------------------------------------------------------

--
-- 表的结构 `article`
--

CREATE TABLE IF NOT EXISTS `article` (
`articleid` int(10) unsigned NOT NULL,
  `title` varchar(100) NOT NULL,
  `title_en` varchar(150) NOT NULL,
  `keywords` varchar(255) NOT NULL,
  `categoryid` smallint(5) unsigned NOT NULL,
  `summary` text NOT NULL,
  `content` mediumtext NOT NULL,
  `weight` smallint(5) unsigned NOT NULL,
  `userid` int(10) unsigned NOT NULL,
  `state` tinyint(4) NOT NULL,
  `pubtime` datetime NOT NULL,
  `totalviews` bigint(20) unsigned NOT NULL DEFAULT '0',
  `totalcomments` bigint(20) unsigned NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 触发器 `article`
--
DELIMITER //
CREATE TRIGGER `totalarticles_add` AFTER INSERT ON `article`
 FOR EACH ROW BEGIN
UPDATE user SET totalarticles = totalarticles + 1 WHERE userid = new.userid;
UPDATE category SET totalarticles = totalarticles + 1 WHERE categoryid = new.categoryid;
END
//
DELIMITER ;
DELIMITER //
CREATE TRIGGER `totalarticles_reduce` AFTER DELETE ON `article`
 FOR EACH ROW BEGIN
UPDATE user SET totalarticles = totalarticles - 1 WHERE userid = old.userid;
UPDATE category SET totalarticles = totalarticles - 1 WHERE categoryid = old.categoryid;
END
//
DELIMITER ;
DELIMITER //
CREATE TRIGGER `totalarticles_update` AFTER UPDATE ON `article`
 FOR EACH ROW BEGIN

IF new.userid <> old.userid THEN
	UPDATE user SET totalarticles = totalarticles - 1 WHERE userid = old.userid;
	UPDATE user SET totalarticles = totalarticles + 1 WHERE userid = new.userid;
END IF;

IF new.categoryid <> old.categoryid THEN
	UPDATE category SET totalarticles = totalarticles - 1 WHERE categoryid = old.categoryid;
	UPDATE category SET totalarticles = totalarticles + 1 WHERE categoryid = new.categoryid;
END IF;

END
//
DELIMITER ;

-- --------------------------------------------------------

--
-- 表的结构 `category`
--

CREATE TABLE IF NOT EXISTS `category` (
`categoryid` smallint(5) unsigned NOT NULL,
  `categoryname` char(20) NOT NULL,
  `categoryname_en` char(150) NOT NULL,
  `weight` tinyint(3) unsigned NOT NULL,
  `totalarticles` int(10) unsigned NOT NULL DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `comment`
--

CREATE TABLE IF NOT EXISTS `comment` (
`commentid` bigint(20) unsigned NOT NULL,
  `userid` int(10) unsigned NOT NULL,
  `user_nickname` varchar(20) NOT NULL,
  `user_email` varchar(60) NOT NULL,
  `user_qq` varchar(15) NOT NULL,
  `articleid` int(10) unsigned NOT NULL,
  `content` mediumtext NOT NULL,
  `pubtime` datetime NOT NULL,
  `ip` varchar(39) NOT NULL,
  `state` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 触发器 `comment`
--
DELIMITER //
CREATE TRIGGER `totalcomments_add` AFTER INSERT ON `comment`
 FOR EACH ROW BEGIN

IF new.state > 0 THEN
	UPDATE article SET totalcomments = totalcomments + 1 WHERE articleid = new.articleid;
END IF;

IF new.userid > 0 THEN
	UPDATE user SET totalcomments = totalcomments + 1 WHERE userid = new.userid;
END IF;

END
//
DELIMITER ;
DELIMITER //
CREATE TRIGGER `totalcomments_reduce` AFTER DELETE ON `comment`
 FOR EACH ROW BEGIN

IF old.state > 0 THEN
	UPDATE article SET totalcomments = totalcomments - 1 WHERE articleid = old.articleid;
END IF;

IF old.userid > 0 THEN
	UPDATE user SET totalcomments = totalcomments - 1 WHERE userid = old.userid;
END IF;

END
//
DELIMITER ;
DELIMITER //
CREATE TRIGGER `totalcomments_update` AFTER UPDATE ON `comment`
 FOR EACH ROW BEGIN

IF new.state <> old.state THEN
	IF new.state = 1 THEN
		UPDATE article SET totalcomments = totalcomments + 1 WHERE articleid = new.articleid;
	ELSEIF new.state = 0 THEN
		UPDATE article SET totalcomments = totalcomments - 1 WHERE articleid = new.articleid;
	END IF;
END IF;

END
//
DELIMITER ;

-- --------------------------------------------------------

--
-- 表的结构 `link`
--

CREATE TABLE IF NOT EXISTS `link` (
`linkid` smallint(5) unsigned NOT NULL,
  `linkname` char(50) NOT NULL,
  `siteurl` char(80) NOT NULL,
  `logourl` char(150) NOT NULL,
  `introduction` char(255) NOT NULL,
  `weight` tinyint(3) unsigned NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `options`
--

CREATE TABLE IF NOT EXISTS `options` (
  `sitename` varchar(50) NOT NULL,
  `siteurl` varchar(80) NOT NULL,
  `keywords` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `isopen` tinyint(4) NOT NULL,
  `tipstext` text NOT NULL,
  `statcode` text NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `options`
--

INSERT INTO `options` (`sitename`, `siteurl`, `keywords`, `description`, `isopen`, `tipstext`, `statcode`) VALUES
('Let''s Blog', '/', 'blog', 'A blog publishing system', 1, '', '');

-- --------------------------------------------------------

--
-- 表的结构 `user`
--

CREATE TABLE IF NOT EXISTS `user` (
`userid` int(10) unsigned NOT NULL,
  `username` varchar(20) NOT NULL,
  `password` char(40) NOT NULL,
  `groupid` smallint(5) unsigned NOT NULL,
  `nickname` varchar(20) NOT NULL,
  `email` varchar(60) NOT NULL,
  `regtime` datetime NOT NULL,
  `lastactivity` datetime NOT NULL,
  `lastip` varchar(39) NOT NULL,
  `totalarticles` int(10) unsigned NOT NULL DEFAULT '0',
  `totalcomments` bigint(20) unsigned NOT NULL DEFAULT '0'
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `user`
--

INSERT INTO `user` (`userid`, `username`, `password`, `groupid`, `nickname`, `email`, `regtime`, `lastactivity`, `lastip`, `totalarticles`, `totalcomments`) VALUES
(1, 'admin', 'eaeb8c1250f18a13b72c212ceb85f4cfc100f817', 1, 'Administrator', 'admin@letsblog.org', '2015-02-24 11:00:00', '2015-02-24 11:05:55', '::ffff:127.0.0.1', 0, 0);

--
-- 触发器 `user`
--
DELIMITER //
CREATE TRIGGER `totalusers_add` AFTER INSERT ON `user`
 FOR EACH ROW BEGIN
UPDATE usergroup SET totalusers = totalusers + 1 WHERE groupid = new.groupid;
END
//
DELIMITER ;
DELIMITER //
CREATE TRIGGER `totalusers_reduce` AFTER DELETE ON `user`
 FOR EACH ROW BEGIN
UPDATE usergroup SET totalusers = totalusers - 1 WHERE groupid = old.groupid;
END
//
DELIMITER ;
DELIMITER //
CREATE TRIGGER `totalusers_update` AFTER UPDATE ON `user`
 FOR EACH ROW BEGIN
IF new.groupid <> old.groupid THEN
	UPDATE usergroup SET totalusers = totalusers - 1 WHERE groupid = old.groupid;
	UPDATE usergroup SET totalusers = totalusers + 1 WHERE groupid = new.groupid;
END IF;
END
//
DELIMITER ;

-- --------------------------------------------------------

--
-- 表的结构 `usergroup`
--

CREATE TABLE IF NOT EXISTS `usergroup` (
`groupid` smallint(5) unsigned NOT NULL,
  `groupname` char(20) NOT NULL,
  `perm_article` tinyint(4) NOT NULL,
  `perm_comment` tinyint(4) NOT NULL,
  `perm_manage_option` tinyint(4) NOT NULL,
  `perm_manage_user` tinyint(4) NOT NULL,
  `perm_manage_article` tinyint(4) NOT NULL,
  `perm_manage_comment` tinyint(4) NOT NULL,
  `totalusers` int(10) unsigned NOT NULL DEFAULT '0'
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `usergroup`
--

INSERT INTO `usergroup` (`groupid`, `groupname`, `perm_article`, `perm_comment`, `perm_manage_option`, `perm_manage_user`, `perm_manage_article`, `perm_manage_comment`, `totalusers`) VALUES
(1, '超级管理员', 1, 2, 1, 2, 2, 1, 1),
(2, '访客', 0, 1, 0, 0, 0, 0, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `article`
--
ALTER TABLE `article`
 ADD PRIMARY KEY (`articleid`), ADD KEY `article_author` (`userid`), ADD KEY `article_category` (`categoryid`), ADD KEY `article_list_order` (`pubtime`,`weight`), ADD KEY `article_weight` (`weight`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
 ADD PRIMARY KEY (`categoryid`), ADD KEY `category_list_order` (`weight`);

--
-- Indexes for table `comment`
--
ALTER TABLE `comment`
 ADD PRIMARY KEY (`commentid`), ADD KEY `comment_parent` (`articleid`,`state`), ADD KEY `comment_list_order` (`pubtime`);

--
-- Indexes for table `link`
--
ALTER TABLE `link`
 ADD PRIMARY KEY (`linkid`), ADD KEY `link_list_order` (`weight`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
 ADD PRIMARY KEY (`userid`), ADD UNIQUE KEY `user_login` (`username`,`password`), ADD KEY `user_group` (`groupid`);

--
-- Indexes for table `usergroup`
--
ALTER TABLE `usergroup`
 ADD PRIMARY KEY (`groupid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `article`
--
ALTER TABLE `article`
MODIFY `articleid` int(10) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
MODIFY `categoryid` smallint(5) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `comment`
--
ALTER TABLE `comment`
MODIFY `commentid` bigint(20) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `link`
--
ALTER TABLE `link`
MODIFY `linkid` smallint(5) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
MODIFY `userid` int(10) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `usergroup`
--
ALTER TABLE `usergroup`
MODIFY `groupid` smallint(5) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=3;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
