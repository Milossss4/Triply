import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native'
import React, { useState, useCallback, useEffect } from 'react'
import { useFocusEffect } from 'expo-router'
import * as ImagePicker from 'expo-image-picker';
import apiClient from '@/api/apiClient'
import { mainBlue, loadingIndicatorStyle } from '@/constants/theme'
import { Ionicons } from '@expo/vector-icons'
import PhotoViewerModal from '@/components/PhotoViewerModal'
import CustomModal from '@/components/CustomModal';

interface GroupOwner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Group {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  destination: string;
  groupImageUrl: string | null;
  owner: GroupOwner;
}

interface Photo {
  id: number;
  imageUrl: string;
  uploadedBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  uploadedAt: string;
}

const GroupSection = ({ group, currentUserId }: { group: Group, currentUserId: number | null}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const fetchPhotos = async () => {
    try {
      const response = await apiClient.get<Photo[]>(`/media/${group.id}/photos`);
      setPhotos(response.data);
    } catch (error) {
      console.log(`Błąd pobierania zdjęć dla grupy ${group.id}:`, error);
      setTitle("Błąd");
      setMessage("Nie udało się pobrać zdjęć dla tej grupy.");
      setModalVisible(true);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [group.id]);

  const handleDeletePhoto = async (photoId: number) => {
    try {
      await apiClient.delete(`/media/photos/${photoId}`);
      
      setSelectedPhoto(null);
      setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
      
      setTitle("Sukces");
      setMessage("Zdjęcie zostało pomyślnie usunięte.");
      setModalVisible(true);
    } catch (error) {
      console.log("Błąd podczas usuwania zdjęcia:", error);
      setTitle("Błąd");
      setMessage("Nie udało się usunąć zdjęcia.");
      setModalVisible(true);
    }
  };

  const handleAddPress = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      setTitle("Brak uprawnień");
      setMessage("Wymagany jest dostęp do galerii.");
      setModalVisible(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploading(true);

      try {
        const formData = new FormData();

        result.assets.forEach((asset) => {
          const localUri = asset.uri;
          const filename = asset.fileName || localUri.split('/').pop() || `photo_${Date.now()}.jpg`;

          const match = /\.(\w+)$/.exec(filename);
          const type = asset.mimeType || (match ? `image/${match[1]}` : `image/jpeg`);

          formData.append('files', {
            uri: localUri,
            name: filename,
            type: type,
          } as any);
        });

        await apiClient.post(`/media/${group.id}/photos`, formData, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          transformRequest: (data, headers) => {
            return data;
          },
        });

        await fetchPhotos();

      } catch (error: any) {
        console.error("Błąd wysyłania zdjęć:", error);
        if (error.response) {
          console.log("Dane błędu serwera:", error.response.data);
          console.log("Status:", error.response.status);
        }

        setTitle("Błąd");
        setMessage("Wystąpił problem z przesłaniem zdjęć.");
        setModalVisible(true);
      } finally {
        setUploading(false);
      }
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.itemContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.titleContainer} onPress={toggleExpand} activeOpacity={0.7}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={mainBlue}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAddPress}
          style={styles.iconContainer}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="black" />
          ) : (
            <Ionicons name="add-circle-outline" size={32} color={mainBlue} />
          )}
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <View style={styles.galleryContainer}>
          {photos.length > 0 ? (
            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <TouchableOpacity 
                  key={photo.id} 
                  style={styles.photoItemContainer}
                  onPress={() => setSelectedPhoto(photo)} 
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: photo.imageUrl }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noPhotosText}>Brak zdjęć w tej grupie.</Text>
          )}
        </View>
      )}

      <PhotoViewerModal 
        visible={!!selectedPhoto}
        photos={photos}                
        selectedPhoto={selectedPhoto}  
        onClose={() => setSelectedPhoto(null)}
        onDelete={handleDeletePhoto}   
        currentUserId={currentUserId}    
        groupOwnerId={group.owner.id}
      />

      <CustomModal
        visible={modalVisible}
        title={title}
        message={message}
        onClose={() => setModalVisible(false)}
      />

      <View style={styles.thickSeparator} />
    </View>
  );
};

const photosPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          setIsLoading(true);

          const [userResponse, groupsResponse] = await Promise.all([
            apiClient.get('/users/me'),                 
            apiClient.get<Group[]>('/groups/my-groups') 
          ]);

          setCurrentUserId(userResponse.data.id); 
          setGroups(groupsResponse.data);

        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }, [])
  );
  if (isLoading) {
    return (
      <View style={loadingIndicatorStyle}>
        <ActivityIndicator size="large" color={mainBlue} />
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <FlatList
        data={groups}
        renderItem={({ item }) => <GroupSection group={item} currentUserId={currentUserId} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

export default photosPage

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: 'white',
  },

  listContent: {
    paddingTop: 10,
    paddingBottom: 50,
  },

  itemContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 5,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    height: 50,
  },

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  groupName: {
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
  },

  iconContainer: {
    padding: 5,
  },

  galleryContainer: {
    marginBottom: 15,
  },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 6, 
  },

  photoItemContainer: {
    width: '32%',    
    aspectRatio: 1,      
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',  
    backgroundColor: '#f0f0f0',
  },

  photoImage: {
    flex: 1,
    width: undefined,
    height: undefined,
  },

  noPhotosText: {
    color: 'gray',
    fontStyle: 'italic',
    marginTop: 5,
    marginBottom: 15,
    fontSize: 14,
  },

  thickSeparator: {
    height: 1,
    backgroundColor: 'gray',
    width: '100%',
    borderRadius: 2,
  },
})
