import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import dayjs from "dayjs";

export const MentorDashboard = () => {
  const [selectedTab, setSelectedTab] = useState("openSlots");
  const [slots, setSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: "", type: "info" });

  // Calculate next 7 days
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = dayjs().add(i, "day");
    return {
      dayjs: date,
      day: date.format("ddd"),
      date: date.format("D"),
      month: date.format("MMM"),
      formattedDate: date.format("YYYY-MM-DD")
    };
  });

  useEffect(() => {
    // Set default selected date to today
    setSelectedDate(dayjs());
    
    // Fetch data
    axios.get("https://dummy.com/api/pending-requests")
      .then(response => setPendingRequests(response.data.events))
      .catch(error => console.error("Error fetching pending requests", error));

    axios.get("https://dummy.com/api/past-sessions")
      .then(response => setPastSessions(response.data["Past Events"]))
      .catch(error => console.error("Error fetching past sessions", error))
      .finally(() => setLoading(false));
  }, []);

  const handleDateClick = (index, date) => {
    setActiveDay(index);
    setSelectedDate(date.dayjs);
  };

  const handleAddSlot = () => {
    if (!startTime || !endTime) {
      showNotification("Please select valid start and end times", "error");
      return;
    }
    
    const now = dayjs();
    const selectedDateTime = selectedDate.hour(startTime.hour()).minute(startTime.minute());
    
    if (selectedDateTime.isBefore(now)) {
      showNotification("Cannot create slots in the past", "error");
      return;
    }
    
    if (endTime.isBefore(startTime)) {
      showNotification("End time must be after start time", "error");
      return;
    }
    
    const formattedDate = selectedDate.format("YYYY-MM-DD");
    
    if (!slots[formattedDate]) slots[formattedDate] = [];
    
    const isOverlapping = slots[formattedDate].some(slot =>
      (dayjs(startTime).isBefore(dayjs(slot.end)) && dayjs(endTime).isAfter(dayjs(slot.start)))
    );
    
    if (isOverlapping) {
      showNotification("Time slot overlaps with an existing slot!", "error");
      return;
    }
    
    const newSlot = { 
      start: startTime.format("HH:mm"), 
      end: endTime.format("HH:mm"),
      id: Date.now()
    };
    
    setSlots({ ...slots, [formattedDate]: [...(slots[formattedDate] || []), newSlot] });
    setStartTime(null);
    setEndTime(null);
    
    showNotification("Time slot added successfully!", "success");
  };

  const handleRemoveSlot = (date, slotId) => {
    const updatedSlots = { ...slots };
    updatedSlots[date] = slots[date].filter(slot => slot.id !== slotId);
    setSlots(updatedSlots);
    showNotification("Time slot removed", "info");
  };

  const showNotification = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "info" }), 3000);
  };

  const formatTimeRange = (start, end) => {
    const startHour = parseInt(start.split(":")[0]);
    const startMinute = start.split(":")[1];
    const endHour = parseInt(end.split(":")[0]);
    const endMinute = end.split(":")[1];
    
    const startPeriod = startHour >= 12 ? "PM" : "AM";
    const endPeriod = endHour >= 12 ? "PM" : "AM";
    
    const formattedStartHour = startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour;
    const formattedEndHour = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
    
    return `${formattedStartHour}:${startMinute} ${startPeriod} - ${formattedEndHour}:${endMinute} ${endPeriod}`;
  };

  // Enhanced time picker with circular design
  const EnhancedTimeSelector = ({ label, value, onChange }) => {
    const [showPicker, setShowPicker] = useState(false);
    const periods = ["AM", "PM"];
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = [0, 15, 30, 45];
    
    const [selectedHour, setSelectedHour] = useState(value ? (value.hour() % 12 || 12) : 9);
    const [selectedMinute, setSelectedMinute] = useState(value ? value.minute() : 0);
    const [selectedPeriod, setSelectedPeriod] = useState(value ? (value.hour() >= 12 ? "PM" : "AM") : "AM");
    
    useEffect(() => {
      if (value) {
        setSelectedHour(value.hour() % 12 || 12);
        setSelectedMinute(value.minute());
        setSelectedPeriod(value.hour() >= 12 ? "PM" : "AM");
      }
    }, [value]);
    
    const handleTimeConfirm = () => {
      const hour = selectedPeriod === "PM" ? (selectedHour === 12 ? 12 : selectedHour + 12) : (selectedHour === 12 ? 0 : selectedHour);
      onChange(dayjs().hour(hour).minute(selectedMinute).second(0));
      setShowPicker(false);
    };
    
    const handleReset = () => {
      if (value) {
        setSelectedHour(value.hour() % 12 || 12);
        setSelectedMinute(value.minute());
        setSelectedPeriod(value.hour() >= 12 ? "PM" : "AM");
      } else {
        setSelectedHour(9);
        setSelectedMinute(0);
        setSelectedPeriod("AM");
      }
      setShowPicker(false);
    };
    
    return (
      <div className="relative mb-4">
        <div 
          className="bg-white p-4 rounded-lg cursor-pointer flex justify-between items-center border border-red-200 hover:border-red-400 transition-all duration-200"
          onClick={() => setShowPicker(!showPicker)}
        >
          <span className="text-gray-700 font-medium">{label}</span>
          <div className="flex items-center">
            <span className="font-medium text-red-600">
              {value ? value.format("h:mm A") : "Select time"}
            </span>
            <svg className="w-5 h-5 ml-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <AnimatePresence>
          {showPicker && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-30 mt-2 bg-white rounded-lg shadow-2xl border border-red-100 w-64 p-4 right-0"
            >
              <div className="mb-4 text-center">
                <div className="font-bold text-xl text-red-600">
                  {`${selectedHour}:${selectedMinute === 0 ? '00' : selectedMinute} ${selectedPeriod}`}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-500 mb-2">Hour</div>
                <div className="grid grid-cols-4 gap-2">
                  {hours.map(hour => (
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      key={hour}
                      className={`cursor-pointer rounded-full w-10 h-10 flex items-center justify-center ${
                        selectedHour === hour ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      onClick={() => setSelectedHour(hour)}
                    >
                      {hour}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-500 mb-2">Minute</div>
                <div className="grid grid-cols-4 gap-2">
                  {minutes.map(minute => (
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      key={minute}
                      className={`cursor-pointer rounded-full w-10 h-10 flex items-center justify-center ${
                        selectedMinute === minute ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      onClick={() => setSelectedMinute(minute)}
                    >
                      {minute === 0 ? '00' : minute}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-500 mb-2">Period</div>
                <div className="grid grid-cols-2 gap-2">
                  {periods.map(period => (
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      key={period}
                      className={`cursor-pointer rounded-lg p-2 flex items-center justify-center ${
                        selectedPeriod === period ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      onClick={() => setSelectedPeriod(period)}
                    >
                      {period}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTimeConfirm}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white text-red-600 p-4 shadow-md flex items-center justify-between z-10">
        <div className="flex items-center">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 mr-4 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Mentor Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-red-100 text-red-800 p-2 rounded-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
            MS
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 250, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white shadow-xl h-full flex flex-col overflow-hidden z-20"
            >
              <div className="p-6 flex-1 overflow-y-auto">
                <h2 className="text-xl font-bold text-red-600 mb-6">Mentor Portal</h2>
                
                <div className="space-y-3">
                  {[
                    { id: "openSlots", name: "Availability", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
                    { id: "pendingRequests", name: "Requests", icon: "M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" },
                    { id: "pastSessions", name: "Past Sessions", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }
                  ].map(tab => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full py-3 px-4 rounded-lg font-medium flex items-center transition-all duration-200 ${
                        selectedTab === tab.id 
                          ? 'bg-red-500 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-red-50'
                      }`}
                      onClick={() => setSelectedTab(tab.id)}
                    >
                      <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                      </svg>
                      {tab.name}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                    MS
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">Mentor Smith</p>
                    <p className="text-xs text-gray-500">Web Development</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          {/* Notification */}
          <AnimatePresence>
            {notification.show && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                  notification.type === 'success' ? 'bg-green-500' :
                  notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                } text-white`}
              >
                {notification.message}
              </motion.div>
            )}
          </AnimatePresence>

          {selectedTab === "openSlots" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow-xl p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6">Manage Your Availability</h2>
              
              {/* Date selector */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Select Date</h3>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {next7Days.map((day, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-shrink-0 cursor-pointer rounded-lg p-3 w-24 text-center ${
                        activeDay === index 
                          ? 'bg-red-500 text-white shadow-md' 
                          : 'bg-gray-100 hover:bg-red-50 text-gray-800'
                      }`}
                      onClick={() => handleDateClick(index, day)}
                    >
                      <p className="text-sm font-medium">{day.day}</p>
                      <p className="text-xl font-bold">{day.date}</p>
                      <p className="text-xs">{day.month}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Time selectors */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Select Time Range</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EnhancedTimeSelector 
                    label="Start Time" 
                    value={startTime} 
                    onChange={setStartTime} 
                  />
                  <EnhancedTimeSelector 
                    label="End Time" 
                    value={endTime} 
                    onChange={setEndTime} 
                  />
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-4 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-medium shadow-md transition-all duration-200 flex items-center justify-center"
                  onClick={handleAddSlot}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Availability Slot
                </motion.button>
              </div>
              
              {/* Time slots display */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Your Available Time Slots</h3>
                
                {next7Days.map((day, index) => {
                  const daySlots = slots[day.formattedDate] || [];
                  
                  return (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`mb-6 p-4 rounded-lg ${
                        activeDay === index ? 'bg-red-50 border-l-4 border-red-500' : 'bg-gray-50'
                      }`}
                    >
                      <h4 className="font-medium text-gray-800 mb-2">
                        {day.dayjs.format("dddd, MMMM D")}
                        {day.dayjs.isSame(dayjs(), 'day') && (
                          <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Today</span>
                        )}
                      </h4>
                      
                      {daySlots.length === 0 ? (
                        <p className="text-gray-500 italic">No availability set for this day</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                          {daySlots.map((slot, slotIndex) => (
                            <motion.div
                              key={slotIndex}
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              whileHover={{ scale: 1.03 }}
                              className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col"
                            >
                              <div className="bg-gradient-to-r from-red-500 to-red-600 py-2 px-4">
                                <p className="text-white font-medium">Availability Slot</p>
                              </div>
                              <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-center mb-2">
                                  <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p className="text-gray-800 font-medium">
                                    {formatTimeRange(slot.start, slot.end)}
                                  </p>
                                </div>
                                <div className="flex-1 flex items-end justify-end">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="text-red-500 hover:text-red-700 text-sm flex items-center"
                                    onClick={() => handleRemoveSlot(day.formattedDate, slot.id)}
                                  >
                                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Remove
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
          
          {selectedTab === "pendingRequests" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow-xl p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6">Pending Session Requests</h2>
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                <p className="text-red-800">Your pending mentorship requests will appear here.</p>
              </div>
            </motion.div>
          )}
          
          {selectedTab === "pastSessions" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow-xl p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6">Past Mentorship Sessions</h2>
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                <p className="text-red-800">Your past mentorship sessions will appear here.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};