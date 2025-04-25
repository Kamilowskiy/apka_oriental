-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 22, 2025 at 03:00 PM
-- Wersja serwera: 10.4.32-MariaDB
-- Wersja PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `business_manager`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `calendar_events`
--

CREATE TABLE `calendar_events` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `event_status` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `calendar_type` varchar(50) NOT NULL DEFAULT 'primary'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `calendar_events`
--

INSERT INTO `calendar_events` (`id`, `title`, `start_date`, `end_date`, `event_status`, `created_at`, `updated_at`, `calendar_type`) VALUES
(3, 'Payment Deadline', '2025-04-20 00:00:00', '2025-04-20 23:59:59', 'danger', '2025-04-04 16:30:56', NULL, 'primary'),
(4, 'Planning Session', '2025-04-12 14:00:00', '2025-04-12 16:00:00', 'primary', '2025-04-04 16:30:56', '2025-04-05 14:54:23', 'primary'),
(5, 'Follow-up Call', '2025-04-25 11:00:00', '2025-04-25 11:30:00', 'primary', '2025-04-04 16:30:56', NULL, 'primary'),
(7, 'asddas', '2025-04-12 06:00:00', '2025-04-12 07:00:00', 'primary', '2025-04-05 14:54:08', '2025-04-05 14:54:18', 'primary'),
(8, 'asddas', '2025-04-12 06:00:00', '2025-04-12 15:00:00', 'primary', '2025-04-05 14:56:37', NULL, 'primary');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `clients`
--

CREATE TABLE `clients` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `nip` varchar(10) NOT NULL,
  `address` text NOT NULL,
  `contact_first_name` varchar(100) NOT NULL,
  `contact_last_name` varchar(100) NOT NULL,
  `contact_phone` varchar(15) NOT NULL,
  `email` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `company_name`, `nip`, `address`, `contact_first_name`, `contact_last_name`, `contact_phone`, `email`, `created_at`) VALUES
(49, 'mp-chujs', '0987654213', 'szczyrzyc', 'taki', 'chuj jak kyka nos', '12931902', 'mp@gmail.com', '2025-04-03 12:46:18'),
(50, 'integra meblee', '1234567890', 'Cukierkowa 27, 34-600 lublin', 'Marek', 'Nowak', '112112112', 'integra@gmail.com', '2025-04-03 16:01:02'),
(52, 'taki chuj jak kyka nos', '6789087680', 'Konina 2137', 'Scrapper z', 'koniny', '098765345', 'kykson@gmail.com', '2025-04-04 13:06:06');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `client_documents`
--

CREATE TABLE `client_documents` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `document_path` text NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `hosting`
--

CREATE TABLE `hosting` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `domain_name` varchar(255) NOT NULL,
  `annual_price` decimal(10,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hosting`
--

INSERT INTO `hosting` (`id`, `client_id`, `domain_name`, `annual_price`, `start_date`, `end_date`, `created_at`) VALUES
(24, 50, 'integrameble.pl', 150.00, '2025-04-03', '2026-03-03', '2025-04-03 16:01:27'),
(38, 50, 'integraasdmeble.pl', 159.00, '2025-04-03', '2027-05-04', '2025-04-03 20:42:31'),
(44, 49, 'nvidia.pl', 156.00, '0123-02-24', '0532-04-12', '2025-04-04 11:17:19'),
(57, 50, 'dxd.pl', 1500.00, '2222-02-22', '3321-02-02', '2025-04-04 11:45:29'),
(58, 49, 'integrasdameble.pl', 1600.00, '0000-00-00', '0000-00-00', '2025-04-04 12:11:48'),
(62, 52, 'asd', 155.00, '0000-00-00', '0000-00-00', '2025-04-04 16:39:10');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `services`
--

CREATE TABLE `services` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `service_name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `client_id`, `service_name`, `price`, `start_date`, `end_date`, `created_at`) VALUES
(2, 50, 'Stworzenie strony internetowej', 1500.00, '2025-04-03', '2025-03-20', '2025-04-03 16:01:49'),
(4, 50, 'Stworzenie sklepu internetowej', 15200.00, '2222-02-22', '2202-03-22', '2025-04-04 11:41:35'),
(7, 52, 'Stworzenie sklepu internetowej', 1500.00, '2025-02-01', '2925-05-02', '2025-04-04 15:12:05'),
(8, 49, 'Stworzenie strony internetowej', 160.00, '0000-00-00', '0000-00-00', '2025-04-04 15:55:25');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `role` enum('user','admin') DEFAULT 'user',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `first_name`, `last_name`, `password`, `email_verified`, `role`, `reset_token`, `reset_token_expires`, `created_at`, `updated_at`) VALUES
(3, 'kamil.15get@gmail.com', 'Kamil', 'Pagacz', '$2b$10$Xsp1FiCehVN4g.9sdBvTPuophEYFHrNYHGfol.c9de1lAWcM8zloa', 0, 'user', NULL, NULL, '2025-04-07 21:48:13', '2025-04-08 17:29:48'),
(4, 'oriental.kontakt@gmail.com', 'asd', 'asd', '$2b$10$.CQVRTRN.NUImLWiaZv.hOHOUXMCnAKr1wKG7lqtN.BLUjLCWo0Mm', 0, 'user', NULL, NULL, '2025-04-08 17:12:24', NULL);

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `calendar_events`
--
ALTER TABLE `calendar_events`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nip` (`nip`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indeksy dla tabeli `client_documents`
--
ALTER TABLE `client_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indeksy dla tabeli `hosting`
--
ALTER TABLE `hosting`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `domain_name` (`domain_name`),
  ADD KEY `client_id` (`client_id`);

--
-- Indeksy dla tabeli `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indeksy dla tabeli `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `calendar_events`
--
ALTER TABLE `calendar_events`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `client_documents`
--
ALTER TABLE `client_documents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hosting`
--
ALTER TABLE `hosting`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `client_documents`
--
ALTER TABLE `client_documents`
  ADD CONSTRAINT `client_documents_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `hosting`
--
ALTER TABLE `hosting`
  ADD CONSTRAINT `hosting_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
