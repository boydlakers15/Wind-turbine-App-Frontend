import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import './post.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../index.css';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

const Post = () => {
  const { t } = useTranslation();
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);
  const [isOpenAddInfo, setIsOpenAddInfo] = useState(false);
  const [addInfo, setAddInfo] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusOrder, setStatusOrder] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
 
  const [update, setUpdate] = useState(null);

   useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_PRODUCTION_API}/users/me`, { withCredentials: true });
        setIsAdmin(response.data.isAdmin);
      } catch (error) {
        console.log(error);
        setIsAdmin(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_PRODUCTION_API}/work/all`, { withCredentials: true });
        setWorkOrders(response.data);
      } catch (error) {
        console.error('Error fetching work orders:', error);
      }
    };

    fetchWorkOrders();
   
  }, [statusOrder,update]); //Upgrade to Workorder card for SAVE and UPLOAD button

  const openAddInfoModal = async (orderId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_PRODUCTION_API}/work/${orderId}`);
      const { addInfo } = response.data;
      setSelectedWorkOrderId(orderId);
      setAddInfo(addInfo);
      setIsOpenAddInfo(true);
    } catch (error) {
      console.error('Failed to fetch work order comments:', error);
    }
  };

  const closeAddInfoModal = () => {
    setSelectedWorkOrderId(null);
    setIsOpenAddInfo(false);
    setAddInfo('');
    setStatusOrder(false);
  };

  const handleAddInfoFormSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.put(`${import.meta.env.VITE_PRODUCTION_API}/work/update/${selectedWorkOrderId}`, {
        addInfo: addInfo,
        status: statusOrder, // Set the status to true when the "SAVE" button is clicked
      });
      console.log("Work order updated:", response.data);
      closeAddInfoModal();
      setWorkOrders((prevWorkOrders) =>
        prevWorkOrders.map((workOrder) => {
          if (workOrder._id === selectedWorkOrderId) {
            return { ...workOrder, status: true };
          } else {
            return workOrder;
          }
        })
      );
    } catch (error) {
      console.error("Failed to update work order:", error);
    }
  };


  
  const handleSubmit = async (workOrderId , e) => {
    e.preventDefault();

    try {
      // Create a new FormData object
      const formData = new FormData();
      formData.append('upload_preset', 'v2ng3uyg'); // Cloudinary upload preset
      formData.append('file', update); // Append the profile image file to the form data

      // Make a request to upload the profile image to Cloudinary
      const uploadResponse = await axios.post(
        'https://api.cloudinary.com/v1_1/windturbineprofile/image/upload',
        formData
      );

      // Get the URL of the uploaded image from the response
      const updateUrl = uploadResponse.data.secure_url;

      // Make a request to upload the file for the Wordorder
      const signupResponse = await axios.put(`${import.meta.env.VITE_PRODUCTION_API}/work/update/${workOrderId}`,
        {
          
          update: updateUrl // Pass the profile image URL in the request
        }
      );

      // Reset the form fields
     
      setUpdate(null);
      // Redirect to the wind turbines page or perform any other desired action
     
    } catch (error) {
      console.error('Error uploading in Workorder:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUpdate(file);
  };

  const deleteWorkOrder = async (workOrderId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_PRODUCTION_API}/work/delete/${workOrderId}`, { withCredentials: true });
      setWorkOrders((prevWorkOrders) => prevWorkOrders.filter((workOrder) => workOrder._id !== workOrderId));
    } catch (error) {
      console.error('Failed to delete work order:', error);
    }
  };

  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
  
  return (
    <div className="post">
      <div className="postWrapper">
        <div className="card-deck row row-cols-1 row-cols-md-3">
          {workOrders.length > 0 ? (
            workOrders.map((workOrder) => (
              <div
                key={workOrder._id}
                className={`card ${workOrder.status ? 'card-done' : ''}`}
                style={{ width: '18rem', backgroundColor: workOrder.status ? '#2ecc71' : '' }}
              >
                <div className="card-body">
                  <div className="card-title">
                    {t('Post.orderStatus')}:{workOrder.status} &nbsp; {!workOrder.status ? t('Post.open') : t('Post.close')}
                  </div>
                  
                  <hr />
                  <h5 className="card-title">
                    {t('Post.orderId')}:&nbsp; <span style={{ fontWeight: 'normal' }}>{workOrder.orderId}</span>
                  </h5>
                  <hr />
                  <h5 className="card-title">
                    {t('Post.technician')}:&nbsp; <span style={{ fontWeight: 'normal' }}>{workOrder.technician}</span>
                  </h5>
                  <hr />
                  <div>
                    <div className="card-text">
                      <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{t('Post.coordinates')}:&nbsp;</span>{' '}
                      {workOrder.location}
                      <hr />
                    </div>
                    {/* Other card texts */}
                  </div>
                  
                  {/* Form to upload documents/images */}
                  {!workOrder.update && (
                  <form className="signup-form" onSubmit={(e) => handleSubmit(workOrder._id, e)}>
                     <div className="form-group">
                       <input
                        type="file"
                        id="update"
                        className="form-input"
                        accept="image/*"
                        onChange={handleFileChange}
                        />
                      <button type="submit" className="signup-button">
                        Submit
                      </button>
                    </div>
                 
                  </form>
                  )}
                   

                  <Box marginBottom="1rem">

                  </Box>
                  
                  {isAdmin && (
                    <Button  className='donebutton' colorScheme="red" onClick={() => deleteWorkOrder(workOrder._id)}>
                      {t('Post.deleteButton')}
                    </Button>
                  )}
                  &nbsp;
                  {!workOrder.status && (
                    <>
                      <Button className='donebutton' colorScheme="blue" onClick={() => openAddInfoModal(workOrder._id)}>
                        {t('Post.doneButton')}
                      </Button>
                    </>
                  )}
                  
                  {uploadedFiles[workOrder.orderId] && uploadedFiles[workOrder.orderId].filePath && (
                    <div>
                      <h6>Uploaded File:</h6>
                      <a
                        href={`${import.meta.env.VITE_PRODUCTION_API}/${uploadedFiles[workOrder.orderId].filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {uploadedFiles[workOrder.orderId].filename}
                      </a>
                    </div>
                  )}
                     {/* Display WorkOrder Image Name */}
                     {workOrder.image && (
                      <div>
                       <a
                          href={workOrder.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'underline', cursor: 'pointer'}}
                        >
                          <h4>Doc Order</h4>
                          
                        </a>
                      </div>
                     
                    )}
                     {/* Display WorkOrder Image Name */}
                     {workOrder.update && (
                      <div>
                        {/* <h6>WorkOrder Image:</h6> */}
                        <a
                          href={workOrder.update}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          <h4>Finished Order</h4>
                          
                        </a>
                      </div>
                       )}
                </div>
                {/* Display manual comments  */}
                <p>Comments: { workOrder.addInfo}</p>
              </div>
            ))
          ) : (
            <p>{t('Post.noWorkOrders')}</p>
          )}
        </div>
      </div>
      {selectedWorkOrderId && (
        <Modal isOpen={isOpenAddInfo} onClose={closeAddInfoModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t('Post.addInfoModalTitle')}</ModalHeader>
            <ModalBody>
              <form onSubmit={handleAddInfoFormSubmit}>
                <FormControl>
                  <FormLabel>{t('Post.informationLabel')}:</FormLabel>
                  <Input
                    type="text"
                    placeholder={t('Post.informationPlaceholder')}
                    value={addInfo}
                    onChange={(e) => setAddInfo(e.target.value)}
                  />
                </FormControl>
                <ModalFooter>
                  <Button colorScheme="blue" mr={3} onClick={closeAddInfoModal}>
                    {t('Post.closeButton')}
                  </Button>
                  <Button type="submit" colorScheme="green" mr={3} onClick={() => setStatusOrder(true)}>
                    {t('Post.saveButton')}
                  </Button>
                </ModalFooter>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
      
    </div>
  );
};

export default Post;
