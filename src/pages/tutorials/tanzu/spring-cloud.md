---
layout: tutorials
title: Spring Cloud
summary: A Simple Application showing how to consume the VCAP_SERVICES using Spring Cloud Connectors.
icon: I_spring_cloud.svg
links:
    - label: feedback
      link: https://github.com/SolaceDev/solace-dev-tutorials/blob/master/src/pages/tutorials/tanzu/spring-cloud.md
---

## Overview

This tutorial is part of a series of tutorials which aims to introduce users to Solace PubSub+ in Pivotal Cloud Foundry. Solace PubSub+ in Pivotal Cloud Foundry is delivered as a Tile on the [Pivotal Network](https://network.pivotal.io/). You can see the [Solace PubSub+ for Pivotal Cloud Foundry Documentation](https://docs.pivotal.io/solace-messaging) for full details.

This tutorial is similar to the [Java App](../java-app/) tutorial. Like the Java App tutorial, it will introduce you to Solace PubSub+ for Pivotal Cloud Foundry by creating a Java application.  In contrast to the Java App, this application uses the Spring Cloud Connectors library to simplify the parsing of the `VCAP_SERVICES` environment variable.

![Diagram: Spring Cloud App Architecture](../../../images/diagrams/spring-cloud-app-architecture.png)

## Goals

The goal of this tutorial is to demonstrate extracting the information from the application's Cloud Foundry Service Bindings and connect to the Solace PubSub+ service instance.  This tutorial will show you:

1. How to extract the Solace PubSub+ service credentials from the Cloud Foundry environment using Spring Cloud Connectors.
1. How to establish a connection to the Solace PubSub+ service.
1. How to publish, subscribe and receive messages.

## Assumptions

This tutorial assumes the following:

* You are familiar with Solace [core concepts](https://docs.solace.com/PubSub-Basics/Core-Concepts.htm).
* You are familiar with [Spring RESTful Web Services](https://spring.io/guides/gs/rest-service).
* You are familiar with [Cloud Foundry](https://www.cloudfoundry.org/).
* You have access to a running Pivotal Cloud Foundry environment.
* Solace PubSub+ for PCF has been installed in your Pivotal Cloud Foundry environment.

## Obtaining the Solace API

This tutorial depends on you having the Solace PubSub+ API for Java (JCSMP). Here are a few easy ways to get the Java API. The instructions in the [Building](#building) section assume you're using Gradle and pulling the jars from maven central. If your environment differs then adjust the build instructions appropriately.

### Get the API: Using Gradle

```
compile("com.solacesystems:sol-jcsmp:10.+")
```

### Get the API: Using Maven

```
<dependency>
  <groupId>com.solacesystems</groupId>
  <artifactId>sol-jcsmp</artifactId>
  <version>10.+</version>
</dependency>
```

### Get the API: Using the Solace Developer Portal

The Java API library can be [downloaded here](https://www.solace.com/downloads/). The Java API is distributed as a zip file containing the required jars, API documentation, and examples.

## Code Walk Through

This section will explain what the code in the samples does.

### Structure

The sample application contains the following source files :

| Source File      | Description |
| ---------------- | ----------- |
| Application.java | The Sprint Boot application class |
| SolaceController.java | The Application's REST controller which provides an interface to subscribe, publish and receive messages.  This class also implements the initialization procedure which connects the application to the Solace PubSub+ Service. |
| SimpleMessage.java | This class wraps the information to be stored in a message |
| SimpleSubscription.java | This class wraps the information describing a topic subscription |

This tutorial will only cover the source code in `SolaceController.java` as the other files do not contain logic related to establishing a connection to the Solace PubSub+ Service.

### Obtaining the Solace Credentials in the Application

The Pivotal Cloud Foundry environment exposes any bound Service Instances in a JSON document stored in the `VCAP_SERVICES` environment variable.  Here is an example of a VCAP_SERVICES with all the fields of interest to us:

```
{
  "VCAP_SERVICES": {
    "solace-pubsub": [ {
        "name": "solace-pubsub-sample-instance",
        "label": "solace-pubsub",
        "plan": "enterprise-shared",
        "tags": [
            (...)
            ],
        "credentials": {
          "clientUsername": "v005.cu000001",
          "clientPassword": "bb90fcb0-6c83-4a10-bafa-3ec225bbfc08",
          "msgVpnName": "v005",
            (...)
          "smfHosts": [ "tcp://192.168.132.14:7000" ],
            (...)
        }
      }
    }
  ]
}
```

You can see the full structure of the Solace PubSub+ `VCAP_SERVICES` in the [Solace PubSub+ for PCF documentation](https://docs.pivotal.io/solace-messaging/credentials.html).

This sample use the [Spring Cloud Connectors](https://cloud.spring.io/spring-cloud-connectors) project to retrieve the `VCAP_SERVICES` information in the form of a `ServiceInfo` object. For Solace PubSub+ in Cloud Foundry, there is a Spring Cloud Connectors extension in GitHub called [sl-spring-cloud-connectors](https://github.com/SolaceProducts/solace-spring-cloud/tree/master/solace-spring-cloud-connector)(). This library parses the `VCAP_SERVICES` environment variable and exposes the information by implementing the `ServiceInfo` interface in the `SolaceMessagingInfo` object.

The `init()` method retrieves the Solace PubSub+ Service Instance details for the service named `solace-pubsub-sample-instance` as follows:

```java
CloudFactory cloudFactory = new CloudFactory();
Cloud cloud = cloudFactory.getCloud();

SolaceServiceCredentials solaceServiceCredentials = (SolaceServiceCredentials) cloud
        .getServiceInfo("solace-pubsub-sample-instance");

if (solaceServiceCredentials == null) {
    trace.error("Did not find instance of 'solace-pubsub' service");
    trace.error("************* Aborting Solace initialization!! ************");
    return;
}
```

### Connecting to the Solace PubSub+ Service

Once you have the `SolaceServiceCredentials`, you can create and then connect the Solace Session in the conventional way as outlined in the [Publish/Subscribe tutorial](../../jcsmp/publish-subscribe/). You set the JCSMP properties and then use the `JCSMPFactory` to create a `Session`:

```java
final JCSMPProperties properties = new JCSMPProperties();
properties.setProperty(JCSMPProperties.HOST, solaceServiceCredentials.getSmfHost());
properties.setProperty(JCSMPProperties.VPN_NAME, solaceServiceCredentials.getMsgVpnName());
properties.setProperty(JCSMPProperties.USERNAME, solaceServiceCredentials.getClientUsername());
properties.setProperty(JCSMPProperties.PASSWORD, solaceServiceCredentials.getClientPassword());

try {
    session = JCSMPFactory.onlyInstance().createSession(properties);
    session.connect();
} catch (Exception e) {
    logger.error("Error connecting and setting up session.", e);
    logger.info("************* Aborting Solace initialization!! ************");
    return;
}
```
Note that the VCAP_SERVICES environment variable contains a json array named smfHosts.
In a High Availability environment this will contain two hosts, the primary router and the backup.
The Spring Cloud connector automatically combines these into a single comma-separated string exposed
as the smfHost property, which is what the JCSMP library expects.

With the Solace session connected. The remainder of this tutorial is exactly the same as the [Java App](../java-app/) tutorial. The details are repeated here for convenience.

### Creating the Message Consumer and Producer

To receive and send messages you will need to create a consumer and a producer by using the connected session. The following code will create a simple message producer that is silent normally but will log any errors it receives:

```java
private class SimplePublisherEventHandler implements JCSMPStreamingPublishEventHandler {
    @Override
    public void responseReceived(String messageID) {
        logger.info("Producer received response for msg: " + messageID);
    }

    @Override
    public void handleError(String messageID, JCSMPException e, long timestamp) {
        logger.error("Producer received error for msg: " + messageID + " - " + timestamp, e);
    }
};
producer = session.getMessageProducer(new SimplePublisherEventHandler());
```

The following code will create a simple message consumer that will log any incoming messages and errors:

```java
private class SimpleMessageListener implements XMLMessageListener {
    @Override
    public void onReceive(BytesXMLMessage receivedMessage) {
        numMessagesReceived.incrementAndGet();

        if (receivedMessage instanceof TextMessage) {
            lastReceivedMessage = (TextMessage) receivedMessage;
            logger.info("Received message : " + lastReceivedMessage.getText());
        } else {
            logger.error("Received message that was not a TextMessage: " + receivedMessage.dump());
        }
    }

    @Override
    public void onException(JCSMPException e) {
        logger.error("Consumer received exception: %s%n", e);
    }
};
final XMLMessageConsumer cons = session.getMessageConsumer(new SimpleMessageListener());
cons.start();
```

### Publishing, Subscribing and Receiving Messages

The consumer created in the previous step will only receive messages matching topics that the Solace session subscribed to. It is thus necessary to create subscriptions in order to receive messages.  You can add a topic subscription by sending a `POST` to the `/subscription` REST endpoint.  The payload of the `POST` is a simple JSON structure containing the topic subscripion. For example: `{"subscription": "test"}`. Here is the method signature:

```java
@RequestMapping(value = "/subscription", method = RequestMethod.POST)
public ResponseEntity<String> addSubscription(@RequestBody SimpleSubscription subscription) {
    // ...
}
```

You can send a message by sending a `POST` to the `/message` REST endpoint.  The payload of the `POST` is a simple JSON structure containing the topic for publishing and the message contents. For example: `{"topic": "test", "body": "Test Message"}`. Here is the method signature:

```java
@RequestMapping(value = "/message", method = RequestMethod.POST)
public ResponseEntity<String> sendMessage(@RequestBody SimpleMessage message) {
   // ...
}
```

Receiving messages is done at the backend via the `SimpleMessageListener` listener described above.  This sample stores the last message received. To access ths received message you can send a `GET` request to `/message` endpoint. The same JSON structure of a message will be returned in the payload of the `GET`.

```java
@RequestMapping(value = "/message", method = RequestMethod.GET)
public ResponseEntity<SimpleMessage> getLastMessageReceived() {
    // ...
}
```

The subscription JSON document used by the `/subscription` endpoint is modeled by the `SimpleSubscription` class, whereas the `/message` endpoint JSON document is modeled by the `SimpleMessage` class.

For more details on sending and receiving messages, you can checkout the [JCSMP Publish/Subscribe tutorial](../../jcsmp/publish-subscribe/).

## Building

The full source code for this example is available in [GitHub](https://github.com/SolaceSamples/solace-samples-cloudfoundry-java). To build, just clone and use gradle. Here is an example:

```
git clone https://github.com/SolaceSamples/solace-samples-cloudfoundry-java
cd solace-samples-cloudfoundry-java
./gradlew build
```

## Cloud Foundry Setup

The sample application specifies a dependency on a service instance named `solace-pubsub-sample-instance` in its manifiest (See `spring-cloud/manifest.yml`).  This must be an instance of the Solace PubSub+ Service which can be created with this command:

```
cf create-service solace-pubsub enterprise-shared solace-pubsub-sample-instance
```

## Deploying

To deploy this tutorial's application you first need to go inside it's project directory and then push the application:

```
cd spring-cloud
cf push
```

This will push the application and will give the application the name specified by the manifest: `solace-sample-spring-cloud`.

## Trying Out The Application

As described above, the sample application has a simple REST interface that allows you to:

* Subscribe
* Send a message
* Receive a message
* Unsubscribe

In order to interact with the application you need to determine the application's URL.  These shell commands can be used to quickly find out the URL:

```
export APP_NAME=solace-sample-spring-cloud
export APP_URL=`cf apps | grep $APP_NAME | grep started | awk '{ print $6}'`
echo "The application URL is: ${APP_URL}"
```

To demonstrate the application we will make the application send a message to itself.  Then we will read the message back to confirm the successful delivery of the message :

```
# Subscribes the application to the topic "test"
curl -X POST -H "Content-Type: application/json;charset=UTF-8" -d '{"subscription": "test"}' http://$APP_URL/subscription

# Send message with topic "test" and this content: "TEST_MESSAGE"
curl -X POST -H "Content-Type: application/json;charset=UTF-8" -d '{"topic": "test", "body": "Test Message"}' http://$APP_URL/message

# The message should have been asynchronously received by the application.  Check that the message was indeed received:
curl -X GET http://$APP_URL/message

# Unsubscribe the application from the topic "test"
curl -X DELETE http://$APP_URL/subscription/test
```
