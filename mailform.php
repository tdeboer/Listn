<?php

/**
 * Send an email to a predefined recipient containing all the data from a form and optional metadata.
 * @author   Jos Juffermans <j.juffermans@webfabriek.nl>
 * @version  1.0, 2007-07-19
 */

define('CRLF', "\r\n");

$mailFormRecipient = false;
$mailFormSubject = false;
$mailFormRedirect = false;
$mailFormMetaData = false;

/**
 * Validate the form data
 */
if (trim(stripslashes($email)) > '')
{
	$mailFormRecipient = validateEmailAddress(stripslashes($email));
}
if (trim(stripslashes($subject)) > '')
{
	$mailFormSubject = stripslashes($subject);
}

/**
 * Exit with an error if the form data could not be validated
 */
if (! ($mailFormRecipient && $mailFormSubject))
{
	if ($mailFormRecipient)
	{
		$errorSubject = $_SERVER['HTTP_HOST'] . $_SERVER['SCRIPT_NAME'] . ' error in form';
		$errorBody = 'Date/time: ' . date('d/m/Y H:i:s') . CRLF;
		if (array_key_exists('HTTP_REFERER', $_SERVER) && ! empty($_SERVER['HTTP_REFERER']))
		{
			$errorBody .= 'From: ' . $_SERVER['HTTP_REFERER'] . CRLF;
		}
		$errorBody .= CRLF . 'Your form contains errors:' . CRLF;
		if (! $mailFormSubject)
		{
			$errorBody .= '  Missing subject field (mf_subject)' . CRLF;
		}
		sendMail($mailFormRecipient, $errorSubject, $errorBody);
	}
	$javascriptAction = 'history.go(-1)';
	$actionMessage = 'You will be redirected back to the previous page.';
	if ($mailFormRedirect)
	{
		$javascriptAction = 'window.location.replace(\'' . $mailFormRedirect . '\')';
		$actionMessage = 'You will be redirected to the next page.';
	}
	// display error message
	exit();
}

/**
 * Generate and send the form data
 */
$separator = str_repeat('_', 60) . CRLF . CRLF;

$mailBody = $message;
//$mailBody = 'Form data:' . CRLF . outputHash($_POST);
// if ($mailFormMetaData)
// {
// 	$mailBody .= $separator;
// 	$mailBody .= 'Meta data:' . CRLF;
// 	$mailBody .= 'Date/time: ' . date('d/m/Y H:i:s') . CRLF;
// 	$mailBody .= 'Referer: ' . (array_key_exists('HTTP_REFERER', $_SERVER) ? $_SERVER['HTTP_REFERER'] : 'none') . CRLF;
// 	$mailBody .= 'Client: ' . (array_key_exists('HTTP_USER_AGENT', $_SERVER) ? $_SERVER['HTTP_USER_AGENT'] : 'none') . CRLF;
// 	$mailBody .= 'Client IP address: ' . (array_key_exists('REMOTE_ADDR', $_SERVER) ? $_SERVER['REMOTE_ADDR'] : 'none') . CRLF;
// 	$mailBody .= 'Authorized user: ' . (array_key_exists('AUTH_USER', $_SERVER) ? $_SERVER['AUTH_USER'] : 'none') . CRLF;
// 	$mailBody .= $separator;
// 	$mailBody .= 'Cookies:' . CRLF . outputHash($_COOKIE) . $separator;
// 	$mailBody .= 'Session data:' . CRLF . outputHash($_SESSION) . $separator;
// }

sendMail($mailFormRecipient, $mailFormSubject, $mailBody);

//header('Location: ' . $mailFormRedirect);
exit();

/**
 * @method   mixed validateEmailAddress(string $emailAddress) return a valid email address or false if the address can not be validated
 * @author   Jos Juffermans <j.juffermans@webfabriek.nl>
 * @since    1.0
 */
function validateEmailAddress($emailAddress = '')
{
	$emailAddress = trim(strtolower($emailAddress));
	if (preg_match('!^[a-z0-9\-\._]{2,}@[a-z0-9\-\._]{2,}\.[a-z]{2,4}$!i', $emailAddress))
	{
		return $emailAddress;
	}
	return false;
}

/**
 * @method   void sendMail(string $recipient, string $subject, string $body) sends an email
 * @author   Jos Juffermans <j.juffermans@webfabriek.nl>
 * @since    1.0
 */
function sendMail($recipient = false, $subject = '', $body = '')
{
	if ($recipient && $subject && $body)
	{
		$headers = 'From: thijs@mediamatic.nl' . CRLF;
		$headers .= 'Date: ' . date('r') . CRLF;
		$headers .= 'Content-Type: text/plain;Charset=UTF-8' . CRLF;
		$headers .= 'Message-ID: <' . date('YmdHis') . '.' . md5(rand(1000, 9999)) . '@' . preg_replace('!^.+@!', '', $recipient) . '>' . CRLF;
		@mail($recipient, $subject, $body, $headers);
	}
}

/**
 * @method   string outputHash(array $hash) returns a string with each key value pair on a separate line
 * @author   Jos Juffermans <j.juffermans@webfabriek.nl>
 * @since    1.0
 */
function outputHash($hash = false)
{
	$output = '';
	if (is_array($hash) && sizeof($hash))
	{
		foreach ($hash as $key => $value)
		{
			$output .= $key . ': ' . $value . CRLF;
		}
	}
	return $output;
}

?>