---
title: SIP introduction
subtitle: Make SIP calls to your Vapi assistant
slug: advanced/sip
---

## Overview

This guide shows you how to set up and test SIP calls to your Vapi assistant using any SIP client or softphone. You'll create an assistant, assign it a SIP phone number, and make a call using a SIP URI. You can also pass template variables via SIP headers.

<Steps>
  <Step title="Create an assistant">
    Create an assistant with the `POST /assistant` endpoint. This is the same as creating an assistant for any other transport.
    ```json
    {
      "name": "My SIP Assistant",
      "firstMessage": "Hello {{first_name}}, you've reached me over SIP."
    }
    ```
  </Step>

  <Step title="Create a SIP phone number">
    Create a SIP phone number with the `POST /phone-number` endpoint.
    ```json
    {
      "provider": "vapi",
      "sipUri": "sip:your_unique_user_name@sip.vapi.ai",
      "assistantId": "your_assistant_id"
    }
    ```
    <Info>
      `sipUri` must be in the format `sip:username@sip.vapi.ai`. You can choose any username you like.
    </Info>
  </Step>

  <Step title="Start a SIP call">
    Use any SIP softphone (e.g., [Zoiper](https://www.zoiper.com/), [Linphone](https://www.linphone.org/)) to dial your SIP URI (e.g., `sip:your_unique_user_name@sip.vapi.ai`).
    
    The assistant will answer your call. No authentication or SIP registration is required.
  </Step>

  <Step title="Send SIP headers to fill template variables">
    To fill template variables, send custom SIP headers with your call.
    
    For example, to fill the `first_name` variable, send a SIP header:
    ```
    x-first_name: John
    ```
    Header names are case-insensitive (e.g., `X-First_Name`, `x-first_name`, and `X-FIRST_NAME` all work).
  </Step>

  <Step title="Use a custom assistant for each call">
    You can use a custom assistant for SIP calls just like for phone calls.
    
    Set the `assistantId` to `null` and the `serverUrl` to your server, which will respond to the `assistant-request` event.
    
    `PATCH /phone-number/:id`
    ```json
    {
      "assistantId": null,
      "serverUrl": "https://your_server_url"
    }
    ```
    Now, every time you make a call to this phone number, your server will receive an `assistant-request` event.
  </Step>
</Steps>
