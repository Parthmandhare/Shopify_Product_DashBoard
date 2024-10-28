import { useState, useCallback } from 'react';
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
  Toast,
  Spinner,
  Banner
} from '@shopify/polaris';
import { useFetcher } from '@remix-run/react';

export default function AddProductModal({ onClose }) {
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    price: '',
    vendor: '',
    files: []
  });
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false
  });

  const fetcher = useFetcher();

  const handleChange = useCallback((field) => (value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles, rejectedFiles) => {
      setFormState(prev => ({ ...prev, files: [...prev.files, ...acceptedFiles] }));
      
      if (rejectedFiles.length > 0) {
        setStatus(prev => ({
          ...prev,
          error: 'Some files were rejected. Please ensure they are images under 20MB.'
        }));
      }
    },
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    try {
      // Validate form
      if (!formState.title || !formState.price) {
        throw new Error('Title and price are required');
      }

      if (isNaN(parseFloat(formState.price)) || parseFloat(formState.price) < 0) {
        throw new Error('Please enter a valid price');
      }

      // Handle image upload
      let imageUrl = '';
      if (formState.files.length > 0) {
        const reader = new FileReader();
        imageUrl = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(formState.files[0]);
        });
      }

      // Submit form data
      const formData = new FormData();
      formData.append('title', formState.title);
      formData.append('description', formState.description);
      formData.append('price', parseFloat(formState.price));
      formData.append('vendor', formState.vendor);
      formData.append('image', imageUrl);

      const response = await fetcher.submit(formData, { method: 'post' });

      if (response?.data?.status === 'error') {
        throw new Error(response.data.message);
      }

      setStatus({ loading: false, error: null, success: true });
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      setStatus({
        loading: false,
        error: error.message || 'An error occurred while creating the product',
        success: false
      });
    }
  };

  const validImageTypes = ['image/gif', 'image/jpeg', 'image/png'];

  return (
    <Page>
      <LegacyCard sectioned>
        {status.error && (
          <Banner status="critical" onDismiss={() => setStatus(prev => ({ ...prev, error: null }))}>
            {status.error}
          </Banner>
        )}
        
        {status.success && (
          <Banner status="success">
            Product created successfully!
          </Banner>
        )}

        <Form onSubmit={handleSubmit}>
          <FormLayout>
            <TextField
              label="Product Title"
              value={formState.title}
              onChange={handleChange('title')}
              autoComplete="off"
              placeholder="Enter product title"
              required
              error={!formState.title && 'Title is required'}
            />

            <TextField
              label="Description"
              value={formState.description}
              onChange={handleChange('description')}
              multiline={4}
              autoComplete="off"
              placeholder="Enter product description"
            />

            <LegacyCard sectioned title="Product Image">
              <DropZone onDrop={handleDropZoneDrop} allowMultiple={false}>
                {formState.files.length > 0 ? (
                  <BlockStack vertical>
                    {formState.files.map((file, index) => (
                      <BlockStack alignment="center" key={index}>
                        <Thumbnail
                          size="small"
                          alt={file.name}
                          source={
                            validImageTypes.includes(file.type)
                              ? window.URL.createObjectURL(file)
                              : null
                          }
                        />
                        <div>{file.name}</div>
                      </BlockStack>
                    ))}
                  </BlockStack>
                ) : (
                  <DropZone.FileUpload actionHint="or drop files to upload" />
                )}
              </DropZone>
            </LegacyCard>

            <TextField
              label="Price"
              value={formState.price}
              onChange={handleChange('price')}
              type="number"
              prefix="$"
              autoComplete="off"
              placeholder="0.00"
              required
              error={formState.price && isNaN(parseFloat(formState.price)) && 'Please enter a valid price'}
            />

            <TextField
              label="Vendor"
              value={formState.vendor}
              onChange={handleChange('vendor')}
              autoComplete="off"
              placeholder="Enter vendor name"
            />

            <InlineStack gap="3">
              <Button onClick={onClose}>Cancel</Button>
              <Button primary submit disabled={status.loading}>
                {status.loading ? <Spinner accessibilityLabel="Loading" size="small" /> : 'Save Product'}
              </Button>
            </InlineStack>
          </FormLayout>
        </Form>
      </LegacyCard>

      {status.success && (
        <Toast content="Product created successfully" onDismiss={() => setStatus(prev => ({ ...prev, success: false }))} />
      )}
    </Page>
  );
}