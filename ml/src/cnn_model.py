"""Baseline Custom CNN Architecture for Food Quality Classification.

Constructs a deep convolutional neural network with residual-free conv-blocks,
batch normalization, dropout regularization, global average pooling, and softmax output.
"""

from typing import List, Optional, Tuple
import tensorflow as tf

# Default input dimensions
DEFAULT_INPUT_SHAPE: Tuple[int, int, int] = (224, 224, 3)
DEFAULT_NUM_CLASSES: int = 2


def build_cnn_model(
    input_shape: Tuple[int, int, int] = DEFAULT_INPUT_SHAPE,
    num_classes: int = DEFAULT_NUM_CLASSES,
    learning_rate: float = 1e-3,
    dropout_rate: float = 0.3,
    model_name: str = "custom_cnn",
) -> tf.keras.Model:
    """Build, assemble, and compile the custom convolutional neural network baseline.
    
    Architecture:
      - Integrated Rescaling: maps pixel values [0, 255] to [0, 1] internally.
      - 4 Convolutional Feature Extraction stages with BatchNormalization and ReLU.
      - Spatial downsampling via MaxPooling2D.
      - GlobalAveragePooling2D for dimensional compression.
      - Dense classification head with dropout and softmax activation.
    """
    inputs = tf.keras.Input(shape=input_shape, name="food_image_input")

    # 1. Internal pixel normalization [0, 255] -> [0.0, 1.0]
    x = tf.keras.layers.Rescaling(1.0 / 255.0, name="rescaling_layer")(inputs)

    # 2. Conv Block 1: 32 filters
    x = tf.keras.layers.Conv2D(32, (3, 3), padding="same", name="conv1_1")(x)
    x = tf.keras.layers.BatchNormalization(name="bn1_1")(x)
    x = tf.keras.layers.ReLU(name="relu1_1")(x)
    x = tf.keras.layers.Conv2D(32, (3, 3), padding="same", name="conv1_2")(x)
    x = tf.keras.layers.BatchNormalization(name="bn1_2")(x)
    x = tf.keras.layers.ReLU(name="relu1_2")(x)
    x = tf.keras.layers.MaxPooling2D((2, 2), name="pool1")(x)
    x = tf.keras.layers.Dropout(0.2, name="drop1")(x)

    # 3. Conv Block 2: 64 filters
    x = tf.keras.layers.Conv2D(64, (3, 3), padding="same", name="conv2_1")(x)
    x = tf.keras.layers.BatchNormalization(name="bn2_1")(x)
    x = tf.keras.layers.ReLU(name="relu2_1")(x)
    x = tf.keras.layers.Conv2D(64, (3, 3), padding="same", name="conv2_2")(x)
    x = tf.keras.layers.BatchNormalization(name="bn2_2")(x)
    x = tf.keras.layers.ReLU(name="relu2_2")(x)
    x = tf.keras.layers.MaxPooling2D((2, 2), name="pool2")(x)
    x = tf.keras.layers.Dropout(0.25, name="drop2")(x)

    # 4. Conv Block 3: 128 filters
    x = tf.keras.layers.Conv2D(128, (3, 3), padding="same", name="conv3_1")(x)
    x = tf.keras.layers.BatchNormalization(name="bn3_1")(x)
    x = tf.keras.layers.ReLU(name="relu3_1")(x)
    x = tf.keras.layers.MaxPooling2D((2, 2), name="pool3")(x)
    x = tf.keras.layers.Dropout(dropout_rate, name="drop3")(x)

    # 5. Conv Block 4: 256 filters
    x = tf.keras.layers.Conv2D(256, (3, 3), padding="same", name="conv4_1")(x)
    x = tf.keras.layers.BatchNormalization(name="bn4_1")(x)
    x = tf.keras.layers.ReLU(name="relu4_1")(x)
    x = tf.keras.layers.MaxPooling2D((2, 2), name="pool4")(x)
    x = tf.keras.layers.Dropout(dropout_rate, name="drop4")(x)

    # 6. Global pooling and classification head
    x = tf.keras.layers.GlobalAveragePooling2D(name="gap")(x)
    x = tf.keras.layers.Dense(128, activation="relu", name="dense_features")(x)
    x = tf.keras.layers.BatchNormalization(name="bn_dense")(x)
    x = tf.keras.layers.Dropout(0.4, name="drop_dense")(x)

    # Output probabilities for Fresh and Spoiled
    outputs = tf.keras.layers.Dense(
        num_classes,
        activation="softmax",
        name="quality_probabilities",
    )(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name=model_name)

    # Compile model with Adam and sparse categorical crossentropy
    optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
    model.compile(
        optimizer=optimizer,
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"],
    )

    return model
