-- For MailReadChecker
-- Nigel Ticknor
--
-- phpMyAdmin SQL Dump
-- version 4.4.15.10
-- https://www.phpmyadmin.net

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mailchecker`
--
CREATE DATABASE IF NOT EXISTS `mailchecker` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `mailchecker`;

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `getEmailFromMD5`(IN `param_md5` CHAR(32))
    READS SQL DATA
SELECT `email` FROM `users` WHERE `md5` = param_md5$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getMailAndMD5`(IN `param_mail` VARCHAR(20), IN `param_emd5` CHAR(32))
    READS SQL DATA
SELECT `count` FROM `checked` WHERE `mid` = param_mail AND `recip` = param_emd5$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getMailAndUser`(IN `param_mail` VARCHAR(20), IN `param_email` VARCHAR(35))
    READS SQL DATA
SELECT `count` FROM `checked` WHERE `mid` = param_mail AND `recip` = getMD5FromEmail(param_email)$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `incrementMailAndMD5`(IN `param_mail` VARCHAR(20), IN `param_emd5` CHAR(32))
    MODIFIES SQL DATA
insert into `checked` values(0,param_mail,param_emd5,1) ON DUPLICATE KEY UPDATE `count`=`count`+1$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `incrementMailAndUser`(IN `param_mail` VARCHAR(20), IN `param_user` VARCHAR(35))
    MODIFIES SQL DATA
insert into `checked` values(0,param_mail,getMD5FromEmail(param_user),1) ON DUPLICATE KEY UPDATE `count`=`count`+1$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `insertUser`(IN `param_email` VARCHAR(35))
    MODIFIES SQL DATA
INSERT INTO `users` VALUES(0,param_email,getMD5FromEmail(param_email))$$

--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `getMD5FromEmail`(`param_email` VARCHAR(35)) RETURNS char(32) CHARSET latin1
    NO SQL
RETURN MD5(LOWER(param_email))$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `checked`
--

CREATE TABLE IF NOT EXISTS `checked` (
  `uid` int(11) NOT NULL COMMENT 'uid for the table',
  `mid` varchar(20) NOT NULL COMMENT 'mail id string',
  `recip` char(32) NOT NULL COMMENT 'user id string',
  `count` int(11) NOT NULL DEFAULT 0 COMMENT 'count'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `uid` int(11) NOT NULL COMMENT 'uid for table',
  `email` varchar(35) NOT NULL,
  `md5` char(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `checked`
--
ALTER TABLE `checked`
  ADD PRIMARY KEY (`uid`),
  ADD UNIQUE KEY `unique_index` (`mid`,`recip`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`uid`),
  ADD UNIQUE KEY `md5` (`md5`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `checked`
--
ALTER TABLE `checked`
  MODIFY `uid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'uid for the table';
--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `uid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'uid for table';
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
