import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { FaArrowLeft, FaEnvelope, FaPhone, FaChevronLeft, FaChevronRight } from "react-icons/fa"
import FeedBackCard from "../components/feedBackCard/FeedBackCard"
import FeedBackCardInput from "../components/feedBackCard/FeedBackCardInput"
import { feedbackMockData } from "../api/__mocks__/data/feedback"
import styles from "./styles/module/MeetingDetailPage.module.css"
import axiosClient from "../api/axiosClient"
import { OpenTalkMeetingStatus } from "../constants/enums/openTalkMeetingStatus"
import { getCurrentUser } from "../helper/auth"
import { createFeedback, getAllFeedbacksByMeetingId } from "../api/apiList"
import SuccessToast from "../components/SuccessToast/SuccessToast.jsx"

const MeetingDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [meeting, setMeeting] = useState(null)
  const [activeTab, setActiveTab] = useState("general")
  const [feedbacks, setFeedbacks] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const location = useLocation()
  const [meetings] = useState(location.state?.meetingList || [])
  const [onTab] = useState(location.state?.onTab || OpenTalkMeetingStatus.UPCOMING)

  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState("success")

  // Function to format date and time from scheduledDate
  const formatDateTime = (scheduledDate) => {
    if (!scheduledDate) return { date: "", time: "" }

    try {
      let dateObj

      // Check if scheduledDate contains time (ISO format or includes 'T')
      if (scheduledDate.includes("T") || scheduledDate.includes(" ")) {
        dateObj = new Date(scheduledDate)
      } else {
        // If only date is provided, add a default time (e.g., 09:00)
        dateObj = new Date(scheduledDate + "T09:00:00")
      }

      // Format date as dd/mm/yyyy
      const date = dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })

      // Format time as HH:MM
      const time = dateObj.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })

      return { date, time }
    } catch (error) {
      console.error("Error formatting date:", error)
      return { date: scheduledDate, time: "" }
    }
  }

  const showToast = (message, type = "success") => {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  const handleDownloadMaterial = async () => {
    try {
      const response = await axiosClient.get(`/files/download-all/${id}`, {
        responseType: "blob",
        validateStatus: (status) => status < 500,
      })

      const contentType = response.headers["content-type"]
      if (contentType && contentType.includes("application/json")) {
        const text = await response.data.text()
        const json = JSON.parse(text)
        alert(json.message || "No attachment found")
        return
      }

      const blob = new Blob([response.data], { type: "application/zip" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `meeting_${id}_materials.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert("Something went wrong while downloading the file.")
    }
  }

  const handleSubmitFeedback = async ({ comment, rating }) => {
    const user = getCurrentUser()
    if (!user || !meeting) return

    try {
      const dto = {
        rate: rating,
        comment,
        user: { id: user.id },
        meeting: { id: meeting.id },
      }

      await createFeedback(dto)
      const updatedFeedbacks = await getAllFeedbacksByMeetingId(meeting.id)
      setFeedbacks(updatedFeedbacks)
      showToast("Feedback submitted successfully!", "success")
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit feedback"
      showToast(msg, "error")
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const local = meetings.find((m) => m.id === Number(id))

      try {
        const feedBackDatas = await getAllFeedbacksByMeetingId(local.id)
        console.log("Fetched feedbacks:", feedBackDatas)
        setFeedbacks(Array.isArray(feedBackDatas) ? feedBackDatas : [])
      } catch (error) {
        console.error("Error fetching feedbacks:", error)
        setFeedbacks(feedbackMockData)
      }
      setMeeting(local)
      setCurrentPage(1)
    }

    fetchData()
  }, [id])

  if (!meeting) return <div className={styles.meetingDetailPage} />

  const host = meeting.host
  const suggestBy = meeting.topic.suggestBy
  const evaluteBy = meeting.topic.evaluteBy
  const { date, time } = formatDateTime(meeting.scheduledDate)
  const totalPages = Math.ceil(feedbacks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedFeedbacks = feedbacks.slice(startIndex, startIndex + itemsPerPage)

  const renderUserInfo = (user) => (
      <>
        <div className={styles.meetingDetailProfileHeader}>
          <img src="/placeholder.svg" alt={user.fullName} className={styles.meetingDetailProfileAvatar} />
          <h2 className={styles.meetingDetailProfileName}>{user.fullName}</h2>
          <p className={styles.meetingDetailProfileTitle}>{user.username}</p>
        </div>
        <div className={styles.meetingDetailContactInfo}>
          <div className={styles.meetingDetailContactItem}>
            <FaEnvelope className={styles.meetingDetailContactIcon} />
            <span>{user.email}</span>
          </div>
          <div className={styles.meetingDetailContactItem}>
            <FaPhone className={styles.meetingDetailContactIcon} />
            <span>000-000-0000</span>
          </div>
          <div className={styles.meetingDetailContactItem}>
            <span>Branch: {user.companyBranch.name}</span>
          </div>
        </div>
      </>
  )

  const renderFeedBackCards = () => {
    return (
        <div className={styles.meetingDetailFeedbackSection}>
          <h2 className={styles.meetingDetailSectionTitle}>FeedBack</h2>
          <div className={styles.meetingDetailFeedbackContent}>
            <FeedBackCardInput onSubmit={handleSubmitFeedback} />
            <div className={styles.meetingDetailFeedbackList}>
              {paginatedFeedbacks.map((fb) => (
                  <FeedBackCard key={fb.id} feedback={fb} />
              ))}
            </div>
          </div>
          <div className={styles.meetingDetailPagination}>
            <div className={styles.meetingDetailPaginationInfo}>
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, feedbacks.length)} of {feedbacks.length}{" "}
              results
            </div>
            <div className={styles.meetingDetailPaginationButtons}>
              <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={styles.meetingDetailPaginationBtn}
              >
                <FaChevronLeft />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                  <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`${styles.meetingDetailPaginationNumber} ${currentPage === i + 1 ? styles.active : ""}`}
                  >
                    {i + 1}
                  </button>
              ))}
              <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={styles.meetingDetailPaginationBtn}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
    )
  }

  return (
      <div className={styles.meetingDetailPage}>
        <div className={styles.meetingDetailPageHeader}>
          <button onClick={() => navigate("/meeting")} className={styles.meetingDetailBackButton}>
            <FaArrowLeft size={16} />
          </button>
          <h1 className={styles.meetingDetailPageTitle}>Meeting Detail</h1>
          <button className={styles.meetingDetailDownloadButton} onClick={handleDownloadMaterial}>
            Download material
          </button>
        </div>

        <div className={styles.meetingDetailContentGrid}>
          <div className={styles.meetingDetailProfileCard}>
            <div className={styles.meetingDetailMeetingHighlight}>
              <h2 className={styles.meetingDetailMeetingName}>{meeting.meetingName}</h2>
              <div className={styles.meetingDetailDetailRow}>
                <span className={styles.meetingDetailLabel}>Date:</span>
                <span className={styles.meetingDetailValue}>{date}</span>
              </div>
              <div className={styles.meetingDetailDetailRow}>
                <span className={styles.meetingDetailLabel}>Time:</span>
                <span className={styles.meetingDetailValue}>{time}</span>
              </div>
              <div className={styles.meetingDetailDetailRow}>
                <span className={styles.meetingDetailLabel}>Meeting Link:</span>
                <a
                    href={meeting.meetingLink}
                    className={`${styles.meetingDetailValue} ${styles.meetingDetailLink}`}
                    target="_blank"
                    rel="noreferrer"
                >
                  {meeting.meetingLink}
                </a>
              </div>
              <div className={styles.meetingDetailDetailRow}>
                <span className={styles.meetingDetailLabel}>Status:</span>
                <span className={styles.meetingDetailValue}>{meeting.status}</span>
              </div>
              <div className={styles.meetingDetailDetailRow}>
                <span className={styles.meetingDetailLabel}>Branch:</span>
                <span className={styles.meetingDetailValue}>{meeting.companyBranch.name}</span>
              </div>
            </div>
          </div>

          <div className={styles.meetingDetailTopicContent}>
            <div className={styles.meetingDetailTabsHeader}>
              <button
                  className={`${styles.meetingDetailTabButton} ${activeTab === "general" ? styles.active : ""}`}
                  onClick={() => setActiveTab("general")}
              >
                Topic General
              </button>
              <button
                  className={`${styles.meetingDetailTabButton} ${activeTab === "host" ? styles.active : ""}`}
                  onClick={() => setActiveTab("host")}
              >
                User Host
              </button>
              <button
                  className={`${styles.meetingDetailTabButton} ${activeTab === "suggest" ? styles.active : ""}`}
                  onClick={() => setActiveTab("suggest")}
              >
                Suggested By
              </button>
              <button
                  className={`${styles.meetingDetailTabButton} ${activeTab === "evaluate" ? styles.active : ""}`}
                  onClick={() => setActiveTab("evaluate")}
              >
                Evaluated By
              </button>
            </div>

            <div className={styles.meetingDetailTabContent}>
              {activeTab === "general" && (
                  <>
                    <div className={styles.meetingDetailDetailRow}>
                      <span className={styles.meetingDetailLabel}>Title:</span>
                      <span className={styles.meetingDetailValue}>{meeting.topic.title}</span>
                    </div>
                    <div className={styles.meetingDetailDetailRow}>
                      <span className={styles.meetingDetailLabel}>Description:</span>
                      <span className={styles.meetingDetailValue}>{meeting.topic.description}</span>
                    </div>
                    <div className={styles.meetingDetailDetailRow}>
                      <span className={styles.meetingDetailLabel}>Remark:</span>
                      <span className={styles.meetingDetailValue}>{meeting.topic.remark}</span>
                    </div>
                  </>
              )}
              {activeTab === "host" && host ? (
                  renderUserInfo(host)
              ) : activeTab === "host" && !host ? (
                  <div className={styles.meetingDetailProfileHeader}>
                    <img src="/placeholder.svg" alt="No Host" className={styles.meetingDetailProfileAvatar} />
                    <h2 className={styles.meetingDetailProfileName}>No Host</h2>
                  </div>
              ) : null}
              {activeTab === "suggest" && suggestBy && renderUserInfo(suggestBy)}
              {activeTab === "evaluate" && evaluteBy && renderUserInfo(evaluteBy)}
            </div>
          </div>
          {onTab != OpenTalkMeetingStatus.UPCOMING && onTab != OpenTalkMeetingStatus.WAITING_HOST_REGISTER
              ? renderFeedBackCards()
              : null}
        </div>

        <SuccessToast
            message={toastMessage}
            isVisible={toastVisible}
            type={toastType}
            onClose={() => setToastVisible(false)}
        />
      </div>
  )
}

export default MeetingDetailPage
