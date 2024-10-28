import {
    Page,
    Form,
    FormLayout,
    TextField,
    LegacyCard,
    DropZone,
    Thumbnail,
    Button,
    BlockStack,
    InlineStack,
    Text,
    Grid
  } from '@shopify/polaris';
  import { useState, useCallback } from 'react';
  
  export default function ProductModal({product}) {
    const [title, setTitle] = useState(product.node.title);
    const [description, setDescription] = useState(product.node.description);
    const [price, setPrice] = useState(product.node.priceRangeV2.minVariantPrice.amount);
    const [vendor, setVendor] = useState(product.node.vendor);
    const [files, setFiles] = useState([]);
    const [existingImages, setExistingImages] = useState(
      product.node.images?.edges || []
    );
  
    const handleDropZoneDrop = useCallback(
      (_dropFiles, acceptedFiles, _rejectedFiles) =>
        setFiles((files) => [...files, ...acceptedFiles]),
      [],
    );
  
    const handleRemoveFile = (index) => {
      setFiles(files => files.filter((_, i) => i !== index));
    };
  
    const handleRemoveExistingImage = (index) => {
      setExistingImages(images => images.filter((_, i) => i !== index));
    };
  
    const validImageTypes = ['image/gif', 'image/jpeg', 'image/png'];
  
    const fileUpload = !files.length && (
      <DropZone.FileUpload actionHint="or drop files to upload" />
    );
  
    const ExistingImagesSection = () => (
      <BlockStack gap="4">
        <Text variant="headingMd" as="h3">Current Images</Text>
        <Grid columns={{ xs: 2, sm: 3, md: 4, lg: 5 }}>
          {existingImages.map((image, index) => (
            <BlockStack key={index} alignment="center" gap="2">
              <div style={{ position: 'relative' }}>
                <Thumbnail
                  source={image.node.url}
                  alt={image.node.altText || 'Product image'}
                  size="large"
                />
                <div style={{ 
                  position: 'absolute', 
                  top: -8, 
                  right: -8 
                }}>
                  <Button 
                    plain 
                    destructive
                    onClick={() => handleRemoveExistingImage(index)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
              <Text variant="bodySm" as="p">Image {index + 1}</Text>
            </BlockStack>
          ))}
        </Grid>
      </BlockStack>
    );
  
    const NewImagesSection = () => (
      <BlockStack gap="4">
        {files.length > 0 && (
          <>
            <Text variant="headingMd" as="h3">New Images to Upload</Text>
            <Grid columns={{ xs: 2, sm: 3, md: 4, lg: 5 }}>
              {files.map((file, index) => (
                <BlockStack key={index} alignment="center" gap="2">
                  <div style={{ position: 'relative' }}>
                    <Thumbnail
                      size="large"
                      alt={file.name}
                      source={
                        validImageTypes.includes(file.type)
                          ? window.URL.createObjectURL(file)
                          : 'https://cdn.shopify.com/s/files/1/0757/9955/files/New_Post.png'
                      }
                    />
                    <div style={{ 
                      position: 'absolute', 
                      top: -8, 
                      right: -8 
                    }}>
                      <Button 
                        plain 
                        destructive
                        onClick={() => handleRemoveFile(index)}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                  <Text variant="bodySm" as="p">{file.name}</Text>
                </BlockStack>
              ))}
            </Grid>
          </>
        )}
      </BlockStack>
    );
  
    return (
      <Page title="Update Product">
        <LegacyCard sectioned>
          <Form onSubmit={() => console.log('Form submitted')}>
            <FormLayout>
              <TextField
                label="Product Title"
                value={title}
                onChange={setTitle}
                autoComplete="off"
                placeholder="Enter product title"
              />
  
              <TextField
                label="Description"
                value={description}
                onChange={setDescription}
                multiline={4}
                autoComplete="off"
                placeholder="Enter product description"
              />
  
              <BlockStack gap="4">
                {existingImages.length > 0 && <ExistingImagesSection />}
                
                <LegacyCard sectioned title="Add More Images">
                  <BlockStack gap="4">
                    <DropZone onDrop={handleDropZoneDrop}>
                      {fileUpload}
                    </DropZone>
                    <NewImagesSection />
                  </BlockStack>
                </LegacyCard>
              </BlockStack>
  
              <TextField
                label="Price"
                value={price}
                onChange={setPrice}
                type="number"
                prefix="$"
                autoComplete="off"
                placeholder="0.00"
              />
  
              <TextField
                label="Vendor"
                value={vendor}
                onChange={setVendor}
                autoComplete="off"
                placeholder="Enter vendor name"
              />
  
              <InlineStack gap="3">
                <Button primary submit>
                  Save
                </Button>
                <Button destructive>
                  Delete
                </Button>
              </InlineStack>
            </FormLayout>
          </Form>
        </LegacyCard>
      </Page>
    );
  }