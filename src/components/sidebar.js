import React from "react"
import { Col, Button } from "react-bootstrap"
import { faGithub } from "@fortawesome/free-brands-svg-icons"
import { faComments } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  TwitterShareButton,
  FacebookShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  TelegramShareButton,
  TwitterIcon,
  FacebookIcon,
  WhatsappIcon,
  LinkedinIcon,
  TelegramIcon,
} from "react-share"

const Sidebar = (props) => {
  let features = props.features
  let tutorials = props.tutorials
  let feedback_link = props.feedback_link
  let section_title = props.section_title
  let pageContext = props.pageContext
  let link = `https://tutorials.solace.dev${props.slug}`
  let social_string = `I am learning ${props.page_title} for ${props.slugRoot} on the Solace API Tutorials page! Check it out here 👇 🤓 \n`
  return (
    <div id="sidebar">
      {tutorials.length !== 0 && (
        <div className="heading">{section_title || "Fundamentals"}</div>
      )}
      <Col>
        {tutorials.map(({ node }) => (
          <div key={node.id} className="pt2 pb2 border-bottom">
            <a
              className={
                pageContext.slug === node.fields.slug ? "c-grey" : "c-grey6"
              }
              href={node.fields.slug}
            >
              {node.frontmatter.title}
            </a>
          </div>
        ))}
      </Col>
      {features.length !== 0 && <div className="heading">Features</div>}
      <Col>
        {features.map(({ node }) => (
          <div key={node.id} className="pt2 pb2 border-bottom">
            <a
              className={
                pageContext.slug === node.fields.slug ? "c-grey" : "c-grey6"
              }
              href={node.fields.slug}
            >
              {node.frontmatter.title}
            </a>
          </div>
        ))}
      </Col>
      <Col>
        <Button
          className="mt3 mb2 w-100"
          href={feedback_link}
          target="_blank"
          rel="noreferrer"
          variant="primary"
          size="sm"
        >
          <FontAwesomeIcon icon={faGithub} size="1x" /> Improve this page{" "}
        </Button>{" "}
        <Button
          className="mt1 mb3 w-100"
          href="https://solace.community/"
          target="_blank"
          rel="noreferrer"
          variant="primary"
          size="sm"
        >
          <FontAwesomeIcon icon={faComments} size="1x" /> Discuss in Community{" "}
        </Button>{" "}
      </Col>
      <Col className="social">
        <TwitterShareButton
          className="pr-1 pl-1"
          url={link}
          title={social_string}
          hashtags={["solace", "pubsub", "tutorial", "DEVCommunity"]}
          via="SolaceDevs"
        >
          <TwitterIcon size={32} round={true} />
        </TwitterShareButton>
        <LinkedinShareButton
          className="pr-1 pl-1"
          url={link}
          summary={social_string}
        >
          <LinkedinIcon size={32} round={true} />
        </LinkedinShareButton>
        <FacebookShareButton
          className="pr-1 pl-1"
          url={link}
          quote={social_string}
          hashtags={["solace", "pubsub", "tutorial", "DEVCommunity"]}
        >
          <FacebookIcon size={32} round={true} />
        </FacebookShareButton>
        <WhatsappShareButton
          className="pr-1 pl-1"
          url={link}
          title={social_string}
        >
          <WhatsappIcon size={32} round={true} />
        </WhatsappShareButton>
        <TelegramShareButton
          className="pr-1 pl-1"
          url={link}
          title={social_string}
        >
          <TelegramIcon size={32} round={true} />
        </TelegramShareButton>
      </Col>
    </div>
  )
}

export default Sidebar
