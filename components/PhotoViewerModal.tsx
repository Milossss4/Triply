import React from 'react';
import { StyleSheet, TouchableOpacity, StatusBar, View, Text, Linking } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import ImageViewing from "react-native-image-viewing";
import CustomModal from './CustomModal';
import ConfirmDeleteModal from './DeleteModal';

interface Photo {
  id: number;
  imageUrl: string;
  uploadedBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface PhotoViewerModalProps {
  visible: boolean;
  photos: Photo[];
  selectedPhoto: Photo | null;
  onClose: () => void;
  onDelete: (photoId: number) => void;
  currentUserId: number | null;
  groupOwnerId: number;
}
const PhotoViewerModal = ({ visible, photos, selectedPhoto, onClose, onDelete, currentUserId, groupOwnerId }: PhotoViewerModalProps) => {
  const images = photos.map(photo => ({ uri: photo.imageUrl }));
  const initialIndex = selectedPhoto ? photos.findIndex(p => p.id === selectedPhoto.id) : 0;
  const startIndex = initialIndex >= 0 ? initialIndex : 0;
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);

  const handleDownload = (imageIndex: number) => {
    const currentPhoto = photos[imageIndex];

    if (currentPhoto && currentPhoto.imageUrl) {
      const downloadUrl = currentPhoto.imageUrl.replace(/\/upload\//, '/upload/fl_attachment/');

      Linking.openURL(downloadUrl).catch(err => {
        setErrorModalVisible(true);
      });
    }
  };

  const handleDeletePress = (imageIndex: number) => {
    const currentPhoto = photos[imageIndex];
    if (!currentPhoto) return;

    setPhotoToDelete(currentPhoto);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (photoToDelete) {
      onDelete(photoToDelete.id);
      setDeleteModalVisible(false);
      setPhotoToDelete(null);
    }
  };

  return (
    <>
      <ImageViewing
        images={images}
        imageIndex={startIndex}
        visible={visible}
        onRequestClose={onClose}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}

        FooterComponent={({ imageIndex }) => (
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              {imageIndex + 1} / {images.length}
            </Text>
          </View>
        )}

        HeaderComponent={({ imageIndex }) => {
          const currentPhoto = photos[imageIndex];
          const canDelete = currentUserId !== null && currentPhoto && (
            currentUserId === groupOwnerId ||
            currentUserId === currentPhoto.uploadedBy.id
          );

          return (
            <View style={styles.headerContainer}>
              <StatusBar barStyle="light-content" />

              {canDelete && (
                <TouchableOpacity
                  style={styles.leftButton}
                  onPress={() => handleDeletePress(imageIndex)}
                >
                  <Ionicons name="trash-outline" size={32} color="#ff4444" />
                </TouchableOpacity>
              )}

              <View style={styles.rightControls}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDownload(imageIndex)}
                >
                  <Ionicons name="download-outline" size={32} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={onClose}
                >
                  <Ionicons name="close-circle" size={40} color="white" />
                </TouchableOpacity>
              </View>

            </View>
          );
        }}
      />

      <CustomModal
        visible={errorModalVisible}
        title="Błąd"
        message="Nie udało się rozpocząć pobierania."
        onClose={() => setErrorModalVisible(false)}
      />

      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title="Usuń zdjęcie"
        message="Czy na pewno chcesz usunąć to zdjęcie? Tej operacji nie można cofnąć."
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
};
export default PhotoViewerModal;

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    width: '100%',
    zIndex: 1,
    top: 0,
  },

  leftButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 5,
    zIndex: 2,
  },

  rightControls: {
    position: 'absolute',
    top: 50,
    right: 15, 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    zIndex: 2,
  },

  iconButton: {
    padding: 5,
  },

  footerContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },

  footerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});