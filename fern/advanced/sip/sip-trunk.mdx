---
title: SIP Trunking
subtitle: How to integrate your SIP provider with Vapi
slug: advanced/sip/sip-trunk
---

SIP trunking replaces traditional phone lines with a virtual connection over the internet, allowing your business to make and receive calls via a broadband connection. It connects your internal PBX or VoIP system to a SIP provider, which then routes calls to the Public Switched Telephone Network (PSTN). This setup simplifies your communications infrastructure and often reduces costs.

## Network requirements

To allow SIP signaling and media between Vapi and your SIP provider, you must allowlist the following IP addresses:

- 44.229.228.186/32
- 44.238.177.138/32

These IPs are used exclusively for SIP traffic. 

<Warning>
We generally don't recommend IP-based authentication for SIP trunks as it can lead to routing issues. Since our servers are shared by many customers, if your telephony provider has multiple customers using IP-based authentication, calls may be routed incorrectly. IP-based authentication works reliably only when your SIP provider offers a unique termination URI or a dedicated SIP server for each customer, as is the case with Plivo and Twilio integrations.
</Warning>

## Supported SIP providers

Vapi supports multiple SIP trunk configurations, including:

- **Plivo**: Uses a unique SIP domain and supports IP-based authentication.
- **Telnyx**: Uses SIP gateway domain (e.g., sip.telnyx.com) with IP-based authentication.
- **Zadarma**: Uses SIP credentials (username/password) with its SIP server (e.g., sip.zadarma.com).
- **Custom "BYO" SIP Trunk**: Allows integration with any SIP provider. You simply provide the SIP gateway address and the necessary authentication details.

## Setup process

<Steps>
  <Step title="Obtain provider details">
    Gather the SIP server address, authentication credentials (username/password or IP-based), and at least one phone number (DID) from your provider.
  </Step>

  <Step title="Create a SIP trunk credential in Vapi">
    Use the Vapi API to create a new credential (type: byo-sip-trunk) with your provider's details. This informs Vapi how to connect to your SIP network.

    **Example (using Zadarma):**
    ```bash
    curl -X POST "https://api.vapi.ai/credential" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_VAPI_PRIVATE_KEY" \
      -d '{
        "provider": "byo-sip-trunk",
        "name": "Zadarma Trunk",
        "gateways": [{
          "ip": "sip.zadarma.com",
          "inboundEnabled": false
        }],
        "outboundLeadingPlusEnabled": true,
        "outboundAuthenticationPlan": {
          "authUsername": "YOUR_SIP_NUMBER",
          "authPassword": "YOUR_SIP_PASSWORD"
        }
      }'
    ```
    Save the returned Credential ID for later use.
  </Step>

  <Step title="Associate a phone number with the SIP trunk">
    Link your external phone number (DID) to the SIP trunk credential in Vapi by creating a Phone Number resource.

    **Example:**
    ```bash
    curl -X POST "https://api.vapi.ai/phone-number" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_VAPI_PRIVATE_KEY" \
      -d '{
        "provider": "byo-phone-number",
        "name": "Zadarma Number",
        "number": "15551234567",
        "numberE164CheckEnabled": false,
        "credentialId": "YOUR_CREDENTIAL_ID"
      }'
    ```
    Note the returned Phone Number ID for use in test calls.
  </Step>

  <Step title="Test your SIP trunk">
    <Steps>
      <Step title="Outbound call test">
        Initiate a call through the Vapi dashboard or API to ensure outbound calls are properly routed.
        
        **API Example:**
        ```json
        POST https://api.vapi.ai/call/phone
        {
          "assistantId": "YOUR_ASSISTANT_ID",
          "customer": {
            "number": "15557654321",
            "numberE164CheckEnabled": false
          },
          "phoneNumberId": "YOUR_PHONE_NUMBER_ID"
        }
        ```
      </Step>
      <Step title="Inbound call test">
        If inbound routing is configured, call your phone number from an external line. Ensure your provider forwards calls to the correct SIP URI (e.g., `{phoneNumber}@<credential_id>.sip.vapi.ai` for Zadarma).
        
        <Warning>
        Note: Please ensure that you provide all the signaling IP addresses when creating the SIP trunk. Failure to do so will prevent proper whitelisting, which may result in encountering unauthorized 401 errors for inbound calls.
        </Warning>
      </Step>
    </Steps>
  </Step>

  <Step title="SIP REFER (call transfer)">
    If you need to transfer a call to another number, you will need to add a SIP Transfer based call forwarding where the transfer number will look like this: `sip:transfer-number@your-telecom-provider-domain.com`

    Example: `sip:15557654321@sip.zadarma.com`

Note: Certain providers require phone numbers to be formatted in the proper E.164 standard. For example, the transfer URI should appear as: `sip:+15557654321@sip.zadarma.com`.
﻿

    Example tool configuration required for SIP REFER:
    ```json
    {
      "type": "transferCall",
      "destinations": [
        {
          "type": "sip",
          "sipUri": "sip:14039932200@sip.telnyx.com"
        }
      ]
    }
    ```
    <Info>You might need to enable SIP REFER in your SIP provider to allow this.</Info>
  </Step>
</Steps>


